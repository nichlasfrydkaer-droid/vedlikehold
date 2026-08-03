import {
  isAllowedWikimediaMediaUrl,
  openMediaReference
} from "../../../src/search/wikimedia.js";

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

export function createProxyRequestHeaders(requestHeaders) {
  const headers = new Headers({ "user-agent": "Vedlikeholdsystem-MediaProxy/2.0 (https://vedlikeholdsystem.no/search)" });
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = requestHeaders.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}

export function createProxyResponseHeaders(upstreamHeaders, status, purpose) {
  const headers = new Headers();
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstreamHeaders.get(name);
    if (value) headers.set(name, value);
  }
  if (status === 206 && !headers.has("accept-ranges")) headers.set("accept-ranges", "bytes");
  if (!headers.has("cache-control")) headers.set("cache-control", purpose === "thumbnail" ? "public, max-age=3600" : "public, max-age=1800");
  headers.set("content-disposition", "inline");
  headers.set("cross-origin-resource-policy", "same-origin");
  headers.set("x-content-type-options", "nosniff");
  return headers;
}

export async function fetchAllowedMedia(url, init, fetchImplementation = fetch) {
  let currentUrl = url;
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    if (!isAllowedWikimediaMediaUrl(currentUrl)) throw new Error("media-host-not-allowed");
    const response = await fetchImplementation(currentUrl, { ...init, redirect: "manual" });
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;
    const location = response.headers.get("location");
    if (!location) throw new Error("media-redirect-location-missing");
    currentUrl = new URL(location, currentUrl).href;
  }
  throw new Error("media-redirect-limit-exceeded");
}

export async function handleMediaRequest(context, fetchImplementation = fetch) {
  const { request, params, env } = context;
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(null, { status: 405, headers: { allow: "GET, HEAD" } });
  }

  try {
    const reference = await openMediaReference(String(params?.token || ""), env?.MEDIA_PROXY_SECRET);
    const upstream = await fetchAllowedMedia(reference.url, {
      method: request.method,
      headers: createProxyRequestHeaders(request.headers)
    }, fetchImplementation);
    if (!upstream.ok && upstream.status !== 304) {
      return errorResponse("Mediekilden er midlertidig utilgjengelig.", 502);
    }
    const contentType = upstream.headers.get("content-type") || "";
    const expectedType = reference.purpose === "thumbnail" || reference.mediaType === "image"
      ? /^image\//iu
      : /^(?:video\/(?:webm|mp4)|application\/(?:ogg|octet-stream))(?:;|$)/iu;
    if (upstream.status !== 304 && !expectedType.test(contentType)) {
      return errorResponse("Mediekilden returnerte et ugyldig format.", 502);
    }

    return new Response(request.method === "HEAD" ? null : upstream.body, {
      status: upstream.status,
      headers: createProxyResponseHeaders(upstream.headers, upstream.status, reference.purpose)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown-error";
    const clientStatus = /invalid|expired/u.test(message) ? 404 : 502;
    console.error(JSON.stringify({ event: "wikimedia-media-proxy-failed", error: message }));
    return errorResponse(clientStatus === 404 ? "Mediet finnes ikke." : "Mediekilden er midlertidig utilgjengelig.", clientStatus);
  }
}

export function onRequest(context) {
  return handleMediaRequest(context);
}
