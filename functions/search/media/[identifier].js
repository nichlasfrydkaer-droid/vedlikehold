const ARCHIVE_METADATA_BASE = "https://archive.org/metadata/";
const ARCHIVE_DOWNLOAD_BASE = "https://archive.org/download/";
const MAX_METADATA_BYTES = 2_000_000;
const ARCHIVE_IDENTIFIER_PATTERN = /^[A-Za-z0-9._-]+$/;
const FORWARDED_REQUEST_HEADERS = ["accept", "if-modified-since", "if-none-match", "if-range", "range"];
const FORWARDED_RESPONSE_HEADERS = [
  "accept-ranges",
  "cache-control",
  "content-length",
  "content-range",
  "content-type",
  "etag",
  "last-modified"
];

function errorResponse(message, status) {
  return new Response(message, {
    status,
    headers: {
      "cache-control": "no-store",
      "content-type": "text/plain; charset=utf-8",
      "x-content-type-options": "nosniff"
    }
  });
}

async function readJsonWithLimit(response, limit) {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > limit) {
    throw new Error("metadata-too-large");
  }
  if (!response.body) throw new Error("metadata-body-missing");

  const reader = response.body.getReader();
  const chunks = [];
  let totalLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalLength += value.byteLength;
    if (totalLength > limit) {
      await reader.cancel("metadata-too-large");
      throw new Error("metadata-too-large");
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

function numericSize(file) {
  const size = Number(file?.size);
  return Number.isFinite(size) && size > 0 ? size : Number.POSITIVE_INFINITY;
}

function playablePriority(file) {
  const name = typeof file?.name === "string" ? file.name.toLowerCase() : "";
  const format = typeof file?.format === "string" ? file.format.toLowerCase() : "";
  const extensionPriority = name.endsWith(".mp4") ? 0 : name.endsWith(".webm") ? 1 : 2;
  const sourcePriority = file?.source === "derivative" ? 0 : 1;
  const formatPriority = format.includes("h.264")
    ? 0
    : format.includes("512kb")
      ? 1
      : format.includes("mpeg4") || format.includes("mpeg-4")
        ? 2
        : format.includes("webm")
          ? 3
          : 4;
  return [extensionPriority, sourcePriority, formatPriority, numericSize(file), name];
}

function comparePriority(left, right) {
  const leftPriority = playablePriority(left);
  const rightPriority = playablePriority(right);
  for (let index = 0; index < leftPriority.length; index += 1) {
    if (leftPriority[index] < rightPriority[index]) return -1;
    if (leftPriority[index] > rightPriority[index]) return 1;
  }
  return 0;
}

export function selectPlayableArchiveFile(files) {
  if (!Array.isArray(files)) return null;
  return files
    .filter((file) => {
      if (!file || typeof file.name !== "string") return false;
      if (file.private === true || file.private === "true") return false;
      const name = file.name.toLowerCase();
      const format = typeof file.format === "string" ? file.format.toLowerCase() : "";
      const supportedExtension = name.endsWith(".mp4") || name.endsWith(".webm");
      const supportedFormat = /h\.264|mpeg-?4|webm/.test(format);
      return supportedExtension && supportedFormat;
    })
    .sort(comparePriority)[0] || null;
}

export function encodeArchiveFilePath(fileName) {
  if (typeof fileName !== "string" || fileName.startsWith("/") || fileName.includes("\\")) return null;
  const segments = fileName.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) return null;
  return segments.map((segment) => encodeURIComponent(segment)).join("/");
}

export function createArchiveRequestHeaders(requestHeaders) {
  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = requestHeaders.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}

export function createClientMediaHeaders(upstreamHeaders) {
  const headers = new Headers();
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstreamHeaders.get(name);
    if (value) headers.set(name, value);
  }
  if (!headers.has("cache-control")) headers.set("cache-control", "public, max-age=3600");
  headers.set("content-disposition", "inline");
  headers.set("cross-origin-resource-policy", "same-origin");
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-media-source", "internet-archive");
  return headers;
}

export function isAllowedArchiveMediaUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && (url.hostname === "archive.org" || url.hostname.endsWith(".archive.org"));
  } catch {
    return false;
  }
}

export async function fetchArchiveMedia(url, init, fetchImplementation = fetch) {
  let currentUrl = url;
  for (let redirectCount = 0; redirectCount <= 3; redirectCount += 1) {
    if (!isAllowedArchiveMediaUrl(currentUrl)) throw new Error("archive-redirect-host-not-allowed");
    const response = await fetchImplementation(currentUrl, { ...init, redirect: "manual" });
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;

    const location = response.headers.get("location");
    if (!location) throw new Error("archive-redirect-location-missing");
    currentUrl = new URL(location, currentUrl).href;
  }
  throw new Error("archive-redirect-limit-exceeded");
}

export async function onRequest(context) {
  const { request, params } = context;
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(null, { status: 405, headers: { allow: "GET, HEAD" } });
  }

  const identifier = typeof params.identifier === "string" ? params.identifier : "";
  if (!ARCHIVE_IDENTIFIER_PATTERN.test(identifier)) {
    return errorResponse("Ugyldig mediereferanse.", 400);
  }

  try {
    const metadataResponse = await fetch(
      `${ARCHIVE_METADATA_BASE}${encodeURIComponent(identifier)}/files`,
      { headers: { accept: "application/json" } }
    );
    if (metadataResponse.status === 404) return errorResponse("Videoen finnes ikke.", 404);
    if (!metadataResponse.ok) return errorResponse("Videokilden er midlertidig utilgjengelig.", 502);

    const metadata = await readJsonWithLimit(metadataResponse, MAX_METADATA_BYTES);
    const file = selectPlayableArchiveFile(metadata?.result);
    const encodedFilePath = encodeArchiveFilePath(file?.name);
    if (!file || !encodedFilePath) return errorResponse("Ingen spillbar videofil ble funnet.", 404);

    const upstreamResponse = await fetchArchiveMedia(
      `${ARCHIVE_DOWNLOAD_BASE}${encodeURIComponent(identifier)}/${encodedFilePath}`,
      {
        method: request.method,
        headers: createArchiveRequestHeaders(request.headers)
      }
    );

    if (!upstreamResponse.ok && upstreamResponse.status !== 304) {
      return errorResponse("Videostrømmen er midlertidig utilgjengelig.", 502);
    }

    return new Response(request.method === "HEAD" ? null : upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: createClientMediaHeaders(upstreamResponse.headers)
    });
  } catch (error) {
    console.error(JSON.stringify({
      event: "archive-media-proxy-failed",
      identifier,
      error: error instanceof Error ? error.message : "unknown-error"
    }));
    return errorResponse("Videostrømmen er midlertidig utilgjengelig.", 502);
  }
}
