const TOKEN_VERSION = 1;
const TOKEN_LIFETIME_MS = 12 * 60 * 60 * 1000;
const MINIMUM_SECRET_LENGTH = 32;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{40,4096}$/;
const WIKIMEDIA_MEDIA_HOST = "upload.wikimedia.org";

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

export function isAllowedWikimediaMediaUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && url.hostname.toLowerCase() === WIKIMEDIA_MEDIA_HOST;
  } catch {
    return false;
  }
}

export async function sealMediaReference(reference, secret, now = Date.now()) {
  if (!isAllowedWikimediaMediaUrl(reference?.url)) throw new Error("invalid-media-reference");
  const payload = { version: TOKEN_VERSION, expiresAt: now + TOKEN_LIFETIME_MS, ...reference };
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await importEncryptionKey(secret);
  const encrypted = new Uint8Array(await crypto.subtle.encrypt(
    { name: "AES-GCM", iv }, key, encoder.encode(JSON.stringify(payload))
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
  const key = await importEncryptionKey(secret);
  let payload;
  try {
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, bytes.slice(12));
    payload = JSON.parse(decoder.decode(decrypted));
  } catch {
    throw new Error("invalid-media-token");
  }
  if (payload?.version !== TOKEN_VERSION || !Number.isFinite(payload?.expiresAt) || payload.expiresAt < now) {
    throw new Error("expired-media-token");
  }
  if (!["thumbnail", "media"].includes(payload?.purpose) || !isAllowedWikimediaMediaUrl(payload?.url)) {
    throw new Error("invalid-media-reference");
  }
  if (payload.purpose === "media" && !["image", "video"].includes(payload.mediaType)) {
    throw new Error("invalid-media-reference");
  }
  return payload;
}

export function cleanWikimediaText(value, maximumLength = 180) {
  if (typeof value !== "string") return "";
  const entities = { amp: "&", quot: "\"", apos: "'", lt: "<", gt: ">", nbsp: " " };
  return value
    .replace(/<[^>]*>/gu, " ")
    .replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/giu, (_, entity) => {
      if (entity[0] === "#") {
        const radix = entity[1]?.toLowerCase() === "x" ? 16 : 10;
        const raw = radix === 16 ? entity.slice(2) : entity.slice(1);
        const codePoint = Number.parseInt(raw, radix);
        return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : " ";
      }
      return entities[entity.toLowerCase()] || " ";
    })
    .replace(/[\u0000-\u001f\u007f]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, maximumLength);
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
