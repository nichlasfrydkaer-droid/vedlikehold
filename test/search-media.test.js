import assert from "node:assert/strict";
import test from "node:test";

import {
  createArchiveRequestHeaders,
  createClientMediaHeaders,
  encodeArchiveFilePath,
  selectPlayableArchiveFile
} from "../functions/search/media/[identifier].js";

test("selects the smallest playable derivative before an original", () => {
  const selected = selectPlayableArchiveFile([
    { name: "large.mov", format: "h.264 HD", source: "original", size: "2000" },
    { name: "video.mp4", format: "h.264", source: "derivative", size: "1000" },
    { name: "video_512kb.mp4", format: "512Kb MPEG4", source: "derivative", size: "500" }
  ]);
  assert.equal(selected.name, "video.mp4");
});

test("rejects non-video and private files", () => {
  assert.equal(selectPlayableArchiveFile([
    { name: "metadata.xml", format: "Metadata" },
    { name: "private.mp4", format: "MPEG4", private: "true" }
  ]), null);
});

test("encodes safe nested filenames and rejects traversal", () => {
  assert.equal(encodeArchiveFilePath("folder/My video.mp4"), "folder/My%20video.mp4");
  assert.equal(encodeArchiveFilePath("../video.mp4"), null);
  assert.equal(encodeArchiveFilePath("/video.mp4"), null);
});

test("forwards only media precondition and range request headers", () => {
  const source = new Headers({
    authorization: "secret",
    cookie: "session=secret",
    range: "bytes=0-1023",
    "if-range": "etag-value"
  });
  const forwarded = createArchiveRequestHeaders(source);
  assert.equal(forwarded.get("range"), "bytes=0-1023");
  assert.equal(forwarded.get("if-range"), "etag-value");
  assert.equal(forwarded.has("authorization"), false);
  assert.equal(forwarded.has("cookie"), false);
});

test("preserves byte-range response headers without upstream cookies or redirects", () => {
  const source = new Headers({
    "accept-ranges": "bytes",
    "content-length": "1024",
    "content-range": "bytes 0-1023/4096",
    "content-type": "video/mp4",
    location: "https://archive.org/redirect",
    "set-cookie": "unsafe=true"
  });
  const headers = createClientMediaHeaders(source);
  assert.equal(headers.get("content-range"), "bytes 0-1023/4096");
  assert.equal(headers.get("content-type"), "video/mp4");
  assert.equal(headers.get("content-disposition"), "inline");
  assert.equal(headers.has("location"), false);
  assert.equal(headers.has("set-cookie"), false);
});
