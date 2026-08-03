import assert from "node:assert/strict";
import test from "node:test";

import { handleSearchRequest, mapPeerTubeResult } from "../functions/search/api.js";
import {
  createProxyRequestHeaders,
  createProxyResponseHeaders,
  fetchAllowedMedia,
  handleMediaRequest
} from "../functions/search/media/[token].js";
import {
  isPublicHttpsUrl,
  openMediaReference,
  sealMediaReference,
  selectPeerTubeWebVideoFile
} from "../src/search/peertube.js";

const SECRET = "test-only-peertube-proxy-secret-at-least-32-characters";
const UUID = "1cf690a1-3d1b-4fdc-9349-6fef0d1bbbed";

test("encrypted media references hide source URLs and reject tampering", async () => {
  const token = await sealMediaReference({ purpose: "video", origin: "https://videos.example.org", uuid: UUID }, SECRET, 1_000);
  assert.equal(token.includes("videos.example.org"), false);
  assert.deepEqual(await openMediaReference(token, SECRET, 1_001), {
    version: 1,
    expiresAt: 43_201_000,
    purpose: "video",
    origin: "https://videos.example.org",
    uuid: UUID
  });
  await assert.rejects(openMediaReference(`${token.slice(0, -1)}A`, SECRET, 1_001), /invalid-media-token/);
});

test("rejects expired references and private-looking upstream URLs", async () => {
  const token = await sealMediaReference({ purpose: "thumbnail", url: "https://videos.example.org/lazy-static/a.jpg" }, SECRET, 1_000);
  await assert.rejects(openMediaReference(token, SECRET, 50_000_000), /expired-media-token/);
  assert.equal(isPublicHttpsUrl("http://videos.example.org/file.mp4"), false);
  assert.equal(isPublicHttpsUrl("https://127.0.0.1/file.mp4"), false);
  assert.equal(isPublicHttpsUrl("https://localhost/file.mp4"), false);
  assert.equal(isPublicHttpsUrl("https://videos.example.org/file.mp4"), true);
});

test("maps a PeerTube result without returning its source host", async () => {
  const mapped = await mapPeerTubeResult({
    uuid: UUID,
    name: "Woodworking",
    url: `https://videos.example.org/videos/watch/${UUID}`,
    thumbnailPath: "/lazy-static/thumbnails/example.jpg",
    channel: { displayName: "Maker" },
    duration: 125
  }, SECRET, 1_000);
  const serialized = JSON.stringify(mapped);
  assert.equal(serialized.includes("videos.example.org"), false);
  assert.equal(mapped.thumbnailUrl.startsWith("/search/media/"), true);
  assert.equal(mapped.videoUrl.startsWith("/search/media/"), true);
});

test("search endpoint returns only sanitized same-origin media references", async () => {
  let requestedUrl;
  const response = await handleSearchRequest({
    request: new Request("https://vedlikeholdsystem.no/search/api?q=wood"),
    env: { PEERTUBE_PROXY_SECRET: SECRET }
  }, async (url) => {
    requestedUrl = String(url);
    return Response.json({ data: [{
      uuid: UUID,
      name: "Woodworking",
      url: `https://videos.example.org/videos/watch/${UUID}`,
      thumbnailPath: "/lazy-static/thumbnails/example.jpg",
      account: { displayName: "Maker" },
      duration: 125
    }] });
  });
  assert.equal(response.status, 200);
  assert.match(requestedUrl, /hasWebVideoFiles=true/);
  assert.match(requestedUrl, /nsfw=false/);
  const body = await response.text();
  assert.equal(body.includes("videos.example.org"), false);
  assert.equal(JSON.parse(body).results.length, 1);
});

test("chooses a 480p web video deterministically", () => {
  const selected = selectPeerTubeWebVideoFile({ files: [
    { fileUrl: "https://media.example.org/1080.mp4", resolution: { id: 1080 }, size: 900 },
    { fileUrl: "https://media.example.org/360.mp4", resolution: { id: 360 }, size: 300 },
    { fileUrl: "https://media.example.org/480.mp4", resolution: { id: 480 }, size: 400 }
  ] });
  assert.equal(selected.fileUrl, "https://media.example.org/480.mp4");
});

test("forwards range headers but never credentials", () => {
  const headers = createProxyRequestHeaders(new Headers({
    authorization: "secret",
    cookie: "session=secret",
    range: "bytes=0-1023",
    "if-range": "etag"
  }));
  assert.equal(headers.get("range"), "bytes=0-1023");
  assert.equal(headers.get("if-range"), "etag");
  assert.equal(headers.has("authorization"), false);
  assert.equal(headers.has("cookie"), false);
});

test("response headers preserve ranges without revealing redirects or cookies", () => {
  const headers = createProxyResponseHeaders(new Headers({
    "content-range": "bytes 0-1023/4096",
    "content-type": "video/mp4",
    location: "https://media.example.org/video.mp4",
    "set-cookie": "unsafe=true"
  }), 206, "video");
  assert.equal(headers.get("content-range"), "bytes 0-1023/4096");
  assert.equal(headers.get("accept-ranges"), "bytes");
  assert.equal(headers.has("location"), false);
  assert.equal(headers.has("set-cookie"), false);
});

test("redirect handling rejects non-public targets", async () => {
  await assert.rejects(fetchAllowedMedia("https://videos.example.org/file", {}, async () => new Response(null, {
    status: 302,
    headers: { location: "http://127.0.0.1/private" }
  })), /media-host-not-allowed/);
});

test("video proxy resolves details and streams a partial response", async () => {
  const token = await sealMediaReference({ purpose: "video", origin: "https://videos.example.org", uuid: UUID }, SECRET);
  const calls = [];
  const response = await handleMediaRequest({
    request: new Request(`https://vedlikeholdsystem.no/search/media/${token}`, { headers: { range: "bytes=0-3" } }),
    params: { token },
    env: { PEERTUBE_PROXY_SECRET: SECRET }
  }, async (url, init) => {
    calls.push({ url: String(url), range: init.headers.get("range") });
    if (String(url).includes("/api/v1/videos/")) {
      return Response.json({ files: [{ fileUrl: "https://media.example.org/video.mp4", resolution: { id: 480 }, size: 4 }] });
    }
    return new Response("data", { status: 206, headers: { "content-type": "video/mp4", "content-range": "bytes 0-3/4" } });
  });
  assert.equal(response.status, 206);
  assert.equal(response.headers.get("content-range"), "bytes 0-3/4");
  assert.deepEqual(calls, [
    { url: `https://videos.example.org/api/v1/videos/${UUID}`, range: null },
    { url: "https://media.example.org/video.mp4", range: "bytes=0-3" }
  ]);
});

test("video proxy accepts octet-stream from a resolved PeerTube file", async () => {
  const token = await sealMediaReference({ purpose: "video", origin: "https://videos.example.org", uuid: UUID }, SECRET);
  const response = await handleMediaRequest({
    request: new Request(`https://vedlikeholdsystem.no/search/media/${token}`),
    params: { token },
    env: { PEERTUBE_PROXY_SECRET: SECRET }
  }, async (url) => String(url).includes("/api/v1/videos/")
    ? Response.json({ files: [{ fileUrl: "https://media.example.org/video.mp4", resolution: { id: 480 }, size: 4 }] })
    : new Response("data", { headers: { "content-type": "application/octet-stream" } }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "application/octet-stream");
});
