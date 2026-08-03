const TOKEN_VERSION = 1;
const TOKEN_LIFETIME_MS = 12 * 60 * 60 * 1000;
const MINIMUM_SECRET_LENGTH = 32;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{40,4096}$/;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

function base64UrlToBytes(value) {
  if (!TOKEN_PATTERN.test(value)) throw new Error("invalid-media-token");
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/") + padding);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function importEncryptionKey(secret) {
  if (typeof secret !== "string" || secret.length < MINIMUM_SECRET_LENGTH) {
    throw new Error("media-token-secret-unavailable");
  }
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export function isPublicHttpsUrl(value) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || url.username || url.password) return false;
    if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) return false;
    if (/^\d{1,3}(?:\.\d{1,3}){3}$/u.test(hostname)) return false;
    if (hostname === "[::1]" || hostname.startsWith("[fc") || hostname.startsWith("[fd") || hostname.startsWith("[fe80:")) return false;
    return hostname.includes(".");
  } catch {
    return false;
  }
}

export function isPeerTubeUuid(value) {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export async function sealMediaReference(reference, secret, now = Date.now()) {
  const payload = {
    version: TOKEN_VERSION,
    expiresAt: now + TOKEN_LIFETIME_MS,
    ...reference
  };
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await importEncryptionKey(secret);
  const encrypted = new Uint8Array(await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(JSON.stringify(payload))
  ));
  const token = new Uint8Array(iv.length + encrypted.length);
  token.set(iv);
  token.set(encrypted, iv.length);
  return bytesToBase64Url(token);
}

export async function openMediaReference(token, secret, now = Date.now()) {
  const bytes = base64UrlToBytes(token);
  if (bytes.length <= 28) throw new Error("invalid-media-token");
  const iv = bytes.slice(0, 12);
  const ciphertext = bytes.slice(12);
  const key = await importEncryptionKey(secret);
  let payload;
  try {
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    payload = JSON.parse(decoder.decode(decrypted));
  } catch {
    throw new Error("invalid-media-token");
  }
  if (payload?.version !== TOKEN_VERSION || !Number.isFinite(payload?.expiresAt) || payload.expiresAt < now) {
    throw new Error("expired-media-token");
  }
  if (payload.purpose === "thumbnail") {
    if (!isPublicHttpsUrl(payload.url)) throw new Error("invalid-media-reference");
    return payload;
  }
  if (payload.purpose === "video") {
    if (!isPublicHttpsUrl(payload.origin) || !isPeerTubeUuid(payload.uuid)) {
      throw new Error("invalid-media-reference");
    }
    return payload;
  }
  throw new Error("invalid-media-reference");
}

export function selectPeerTubeWebVideoFile(video) {
  const files = Array.isArray(video?.files) ? video.files : [];
  return files
    .filter((file) => isPublicHttpsUrl(file?.fileUrl) && /^video\//iu.test(file?.metadata?.mimeType || "video/mp4"))
    .map((file) => ({
      ...file,
      resolutionId: Number(file?.resolution?.id),
      sizeValue: Number(file?.size)
    }))
    .filter((file) => Number.isFinite(file.resolutionId) && file.resolutionId > 0)
    .sort((left, right) => {
      const leftDistance = Math.abs(left.resolutionId - 480);
      const rightDistance = Math.abs(right.resolutionId - 480);
      if (leftDistance !== rightDistance) return leftDistance - rightDistance;
      if (left.resolutionId !== right.resolutionId) return right.resolutionId - left.resolutionId;
      return (left.sizeValue || Number.POSITIVE_INFINITY) - (right.sizeValue || Number.POSITIVE_INFINITY);
    })[0] || null;
}

export async function readJsonWithLimit(response, limit = 2_000_000) {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > limit) throw new Error("upstream-json-too-large");
  if (!response.body) throw new Error("upstream-json-missing");
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel("upstream-json-too-large");
      throw new Error("upstream-json-too-large");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(decoder.decode(bytes));
}

export function safePeerTubeOrigin(item) {
  if (!isPublicHttpsUrl(item?.url)) return null;
  const url = new URL(item.url);
  return url.origin;
}

export function safePeerTubeThumbnailUrl(item, origin) {
  if (typeof item?.thumbnailPath !== "string" || !item.thumbnailPath.startsWith("/lazy-static/")) return null;
  const url = new URL(item.thumbnailPath, origin);
  return url.origin === origin && isPublicHttpsUrl(url.href) ? url.href : null;
}
