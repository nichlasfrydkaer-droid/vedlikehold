import assert from "node:assert/strict";
import test from "node:test";

import { handleSearchRequest, mapWikimediaResult } from "../functions/search/api.js";
import { createProxyRequestHeaders, createProxyResponseHeaders, fetchAllowedMedia, handleMediaRequest } from "../functions/search/media/[token].js";
import { cleanWikimediaText, isAllowedWikimediaMediaUrl, openMediaReference, sealMediaReference } from "../src/search/wikimedia.js";

const SECRET = "test-only-wikimedia-proxy-secret-at-least-32-characters";
const IMAGE_URL = "https://upload.wikimedia.org/wikipedia/commons/a/ab/example.jpg";
const THUMB_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/example.jpg/640px-example.jpg";
const VIDEO_URL = "https://upload.wikimedia.org/wikipedia/commons/1/12/example.webm";

function page({ pageid = 1, title = "File:Woodworking.jpg", mime = "image/jpeg", url = IMAGE_URL, thumburl = THUMB_URL } = {}) {
  return { pageid, title, imageinfo: [{ mime, url, thumburl, user: "Maker", extmetadata: {
    Artist: { value: "<b>Maker &amp; Co.</b>" }, LicenseShortName: { value: "CC BY-SA 4.0" }
  } }] };
}

test("encrypted media references hide Wikimedia URLs and reject tampering", async () => {
  const token = await sealMediaReference({ purpose: "media", url: VIDEO_URL, mediaType: "video", mime: "video/webm" }, SECRET, 1_000);
  assert.equal(token.includes("wikimedia"), false);
  assert.equal((await openMediaReference(token, SECRET, 1_001)).url, VIDEO_URL);
  const middle = Math.floor(token.length / 2);
  const tampered = `${token.slice(0, middle)}${token[middle] === "A" ? "B" : "A"}${token.slice(middle + 1)}`;
  await assert.rejects(openMediaReference(tampered, SECRET, 1_001), /invalid-media-token/);
});

test("only allows Wikimedia upload media URLs", async () => {
  assert.equal(isAllowedWikimediaMediaUrl(IMAGE_URL), true);
  assert.equal(isAllowedWikimediaMediaUrl("https://commons.wikimedia.org/wiki/File:Example.jpg"), false);
  assert.equal(isAllowedWikimediaMediaUrl("https://attacker.example/file.jpg"), false);
  await assert.rejects(sealMediaReference({ purpose: "thumbnail", url: "https://127.0.0.1/file.jpg" }, SECRET), /invalid-media-reference/);
});

test("sanitizes Wikimedia HTML metadata", () => {
  assert.equal(cleanWikimediaText("<a href='x'>Maker &amp; Co.</a>"), "Maker & Co.");
});

test("maps image and supported video without returning source URLs", async () => {
  const image = await mapWikimediaResult(page(), SECRET, 1_000);
  const video = await mapWikimediaResult(page({ pageid: 2, title: "File:Build.webm", mime: "video/webm", url: VIDEO_URL }), SECRET, 1_000);
  assert.equal(image.mediaType, "image");
  assert.equal(video.mediaType, "video");
  assert.equal(image.creator, "Maker & Co.");
  assert.equal(JSON.stringify([image, video]).includes("upload.wikimedia.org"), false);
  assert.match(image.mediaUrl, /^\/search\/media\//u);
});

test("skips unsupported Wikimedia video formats", async () => {
  assert.equal(await mapWikimediaResult(page({ mime: "application/ogg", url: "https://upload.wikimedia.org/example.ogv" }), SECRET), null);
});

test("search endpoint queries Commons and returns sanitized image results", async () => {
  let requestedUrl;
  const response = await handleSearchRequest({
    request: new Request("https://vedlikeholdsystem.no/search/api?q=wood&type=images"), env: { MEDIA_PROXY_SECRET: SECRET }
  }, async (url) => {
    requestedUrl = String(url);
    return Response.json({ query: { pages: [page()] } });
  });
  const body = await response.text();
  assert.equal(response.status, 200);
  assert.match(requestedUrl, /^https:\/\/commons\.wikimedia\.org\/w\/api\.php/u);
  assert.match(requestedUrl, /generator=search/u);
  assert.equal(body.includes("upload.wikimedia.org"), false);
  assert.equal(JSON.parse(body).resultType, "wikimedia-commons-media");
});

test("all search combines separate image and video searches", async () => {
  const calls = [];
  const response = await handleSearchRequest({
    request: new Request("https://vedlikeholdsystem.no/search/api?q=wood&type=all"), env: { MEDIA_PROXY_SECRET: SECRET }
  }, async (url) => {
    calls.push(String(url));
    return String(url).includes("filetype%3Avideo")
      ? Response.json({ query: { pages: [page({ pageid: 2, title: "File:Build.webm", mime: "video/webm", url: VIDEO_URL })] } })
      : Response.json({ query: { pages: [page()] } });
  });
  const payload = await response.json();
  assert.equal(calls.length, 2);
  assert.deepEqual(payload.results.map((item) => item.mediaType).sort(), ["image", "video"]);
});

test("invalid query and media type return 422", async () => {
  assert.equal((await handleSearchRequest({ request: new Request("https://x/search/api?q=x"), env: {} })).status, 422);
  assert.equal((await handleSearchRequest({ request: new Request("https://x/search/api?q=wood&type=audio"), env: {} })).status, 422);
});

test("forwards ranges but never credentials", () => {
  const headers = createProxyRequestHeaders(new Headers({ authorization: "secret", cookie: "x", range: "bytes=0-3", "if-range": "etag" }));
  assert.equal(headers.get("range"), "bytes=0-3");
  assert.equal(headers.has("authorization"), false);
  assert.equal(headers.has("cookie"), false);
});

test("response headers preserve ranges without leaking redirects or cookies", () => {
  const headers = createProxyResponseHeaders(new Headers({ "content-range": "bytes 0-3/4", "content-type": "video/webm", location: VIDEO_URL, "set-cookie": "x" }), 206, "media");
  assert.equal(headers.get("content-range"), "bytes 0-3/4");
  assert.equal(headers.get("accept-ranges"), "bytes");
  assert.equal(headers.has("location"), false);
  assert.equal(headers.has("set-cookie"), false);
});

test("redirect handling rejects non-Wikimedia targets", async () => {
  await assert.rejects(fetchAllowedMedia(IMAGE_URL, {}, async () => new Response(null, { status: 302, headers: { location: "https://attacker.example/file" } })), /media-host-not-allowed/);
});

test("media proxy streams a partial Wikimedia response", async () => {
  const token = await sealMediaReference({ purpose: "media", url: VIDEO_URL, mediaType: "video", mime: "video/webm" }, SECRET);
  const response = await handleMediaRequest({
    request: new Request(`https://vedlikeholdsystem.no/search/media/${token}`, { headers: { range: "bytes=0-3" } }),
    params: { token }, env: { MEDIA_PROXY_SECRET: SECRET }
  }, async (url, init) => {
    assert.equal(String(url), VIDEO_URL);
    assert.equal(init.headers.get("range"), "bytes=0-3");
    return new Response("data", { status: 206, headers: { "content-type": "video/webm", "content-range": "bytes 0-3/4" } });
  });
  assert.equal(response.status, 206);
  assert.equal(await response.text(), "data");
});
