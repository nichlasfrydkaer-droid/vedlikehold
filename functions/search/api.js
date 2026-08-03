import {
  isPeerTubeUuid,
  readJsonWithLimit,
  safePeerTubeOrigin,
  safePeerTubeThumbnailUrl,
  sealMediaReference
} from "../../src/search/peertube.js";

const PEERTUBE_SEARCH_ENDPOINT = "https://sepiasearch.org/api/v1/search/videos";
const MAX_QUERY_LENGTH = 160;
const RESULT_COUNT = 24;

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

function cleanText(value, maximumLength) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001f\u007f]/gu, " ").replace(/\s+/gu, " ").trim().slice(0, maximumLength);
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export async function mapPeerTubeResult(item, secret, now = Date.now()) {
  const origin = safePeerTubeOrigin(item);
  const uuid = isPeerTubeUuid(item?.uuid) ? item.uuid : null;
  const thumbnailSource = origin ? safePeerTubeThumbnailUrl(item, origin) : null;
  if (!origin || !uuid || !thumbnailSource) return null;

  const [thumbnailToken, videoToken] = await Promise.all([
    sealMediaReference({ purpose: "thumbnail", url: thumbnailSource }, secret, now),
    sealMediaReference({ purpose: "video", origin, uuid }, secret, now)
  ]);

  return {
    id: uuid,
    title: cleanText(item.name, 180) || "Uten tittel",
    creator: cleanText(item?.channel?.displayName || item?.account?.displayName || item?.channel?.name, 100) || "Ukjent kanal",
    durationSeconds: numberOrNull(item.duration),
    publishedAt: typeof item.publishedAt === "string" ? item.publishedAt : null,
    thumbnailUrl: `/search/media/${thumbnailToken}`,
    videoUrl: `/search/media/${videoToken}`,
    mediaType: "video"
  };
}

export async function handleSearchRequest(context, fetchImplementation = fetch) {
  const { request, env } = context;
  if (request.method !== "GET") {
    return new Response(null, { status: 405, headers: { allow: "GET" } });
  }

  const query = new URL(request.url).searchParams.get("q")?.trim() || "";
  if (query.length < 2 || query.length > MAX_QUERY_LENGTH) {
    return jsonResponse({ error: "invalid-query" }, 422);
  }

  const upstreamUrl = new URL(PEERTUBE_SEARCH_ENDPOINT);
  upstreamUrl.searchParams.set("search", query);
  upstreamUrl.searchParams.set("count", String(RESULT_COUNT));
  upstreamUrl.searchParams.set("start", "0");
  upstreamUrl.searchParams.set("nsfw", "false");
  upstreamUrl.searchParams.set("hasWebVideoFiles", "true");

  try {
    const upstream = await fetchImplementation(upstreamUrl, {
      headers: { accept: "application/json", "user-agent": "Vedlikeholdsystem-MediaSearch/1.0" }
    });
    if (!upstream.ok) return jsonResponse({ error: "search-unavailable" }, 502);
    const payload = await readJsonWithLimit(upstream);
    const mapped = await Promise.all((Array.isArray(payload?.data) ? payload.data : [])
      .slice(0, RESULT_COUNT)
      .map((item) => mapPeerTubeResult(item, env?.PEERTUBE_PROXY_SECRET)));
    return jsonResponse({ results: mapped.filter(Boolean), resultType: "peertube-video" });
  } catch (error) {
    console.error(JSON.stringify({
      event: "peertube-search-failed",
      error: error instanceof Error ? error.message : "unknown-error"
    }));
    return jsonResponse({ error: "search-unavailable" }, 502);
  }
}

export function onRequest(context) {
  return handleSearchRequest(context);
}
