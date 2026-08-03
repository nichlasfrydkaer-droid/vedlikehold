import { cleanWikimediaText, isAllowedWikimediaMediaUrl, readJsonWithLimit, sealMediaReference } from "../../src/search/wikimedia.js";

const WIKIMEDIA_API_ENDPOINT = "https://commons.wikimedia.org/w/api.php";
const MAX_QUERY_LENGTH = 160;
const RESULT_COUNT = 24;
const SEARCH_TYPES = new Set(["all", "images", "video"]);
const VIDEO_MIME_TYPES = new Set(["video/webm", "video/mp4"]);

function jsonResponse(payload, status = 200) {
  return Response.json(payload, {
    status,
    headers: {
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
      "x-content-type-options": "nosniff"
    }
  });
}

export async function mapWikimediaResult(page, secret, now = Date.now()) {
  const info = page?.imageinfo?.[0];
  const mime = typeof info?.mime === "string" ? info.mime.toLowerCase() : "";
  const mediaType = mime.startsWith("image/") ? "image" : VIDEO_MIME_TYPES.has(mime) ? "video" : null;
  const thumbnailSource = info?.thumburl || (mediaType === "image" ? info?.url : null);
  if (!mediaType || !isAllowedWikimediaMediaUrl(info?.url) || !isAllowedWikimediaMediaUrl(thumbnailSource)) return null;

  const [thumbnailToken, mediaToken] = await Promise.all([
    sealMediaReference({ purpose: "thumbnail", url: thumbnailSource }, secret, now),
    sealMediaReference({ purpose: "media", url: info.url, mediaType, mime }, secret, now)
  ]);

  const metadata = info.extmetadata || {};
  const rawTitle = String(page?.title || "").replace(/^File:/iu, "");

  return {
    id: String(page?.pageid || rawTitle),
    title: cleanWikimediaText(rawTitle, 180) || "Uten tittel",
    creator: cleanWikimediaText(metadata?.Artist?.value || info?.user, 120) || "Ukjent opphavsperson",
    license: cleanWikimediaText(metadata?.LicenseShortName?.value, 80) || "Kontroller lisens",
    thumbnailUrl: `/search/media/${thumbnailToken}`,
    mediaUrl: `/search/media/${mediaToken}`,
    mediaType
  };
}

function buildSearchUrl(query, type) {
  const url = new URL(WIKIMEDIA_API_ENDPOINT);
  const search = type === "video" ? `${query} filetype:video` : query;
  const limit = type === "video" ? 40 : RESULT_COUNT;
  Object.entries({
    action: "query", generator: "search", gsrnamespace: "6", gsrlimit: String(limit), gsrsearch: search,
    prop: "imageinfo", iiprop: "url|mime|mediatype|user|extmetadata", iiurlwidth: "640",
    format: "json", formatversion: "2"
  }).forEach(([name, value]) => url.searchParams.set(name, value));
  return url;
}

async function searchWikimedia(query, type, secret, fetchImplementation) {
  const upstream = await fetchImplementation(buildSearchUrl(query, type), {
    headers: { accept: "application/json", "user-agent": "Vedlikeholdsystem-MediaSearch/2.0 (https://vedlikeholdsystem.no/search)" }
  });
  if (!upstream.ok) throw new Error("search-unavailable");
  const payload = await readJsonWithLimit(upstream);
  const pages = Array.isArray(payload?.query?.pages) ? payload.query.pages : [];
  const mapped = await Promise.all(pages.map((page) => mapWikimediaResult(page, secret)));
  return mapped.filter((item) => item && (type !== "images" || item.mediaType === "image") && (type !== "video" || item.mediaType === "video"));
}

export async function handleSearchRequest(context, fetchImplementation = fetch) {
  const { request, env } = context;
  if (request.method !== "GET") {
    return new Response(null, { status: 405, headers: { allow: "GET" } });
  }

  const query = new URL(request.url).searchParams.get("q")?.trim() || "";
  const type = new URL(request.url).searchParams.get("type") || "all";
  if (query.length < 2 || query.length > MAX_QUERY_LENGTH) {
    return jsonResponse({ error: "invalid-query" }, 422);
  }
  if (!SEARCH_TYPES.has(type)) return jsonResponse({ error: "invalid-type" }, 422);

  try {
    const lists = type === "all"
      ? await Promise.all([searchWikimedia(query, "images", env?.MEDIA_PROXY_SECRET, fetchImplementation), searchWikimedia(query, "video", env?.MEDIA_PROXY_SECRET, fetchImplementation)])
      : [await searchWikimedia(query, type, env?.MEDIA_PROXY_SECRET, fetchImplementation)];
    const results = type === "all"
      ? [...lists[0].slice(0, RESULT_COUNT / 2), ...lists[1].slice(0, RESULT_COUNT / 2)]
      : lists[0].slice(0, RESULT_COUNT);
    return jsonResponse({ results, resultType: "wikimedia-commons-media" });
  } catch (error) {
    console.error(JSON.stringify({
      event: "wikimedia-search-failed",
      error: error instanceof Error ? error.message : "unknown-error"
    }));
    return jsonResponse({ error: "search-unavailable" }, 502);
  }
}

export function onRequest(context) {
  return handleSearchRequest(context);
}
