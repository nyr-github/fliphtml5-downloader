import assert from "node:assert/strict";
import test from "node:test";
import { buildPageUrl, extractIdsFromUrl, loadBookConfig, parseBookConfig } from "../lib/book-config";

const base = "https://online.fliphtml5.com/author/publication/";
const config = (value: unknown) => `window.htmlConfig = ${JSON.stringify(value)};`;
const pages = [{ n: ["./files/large/1.jpg"], t: "files/thumb/1.jpg" }];

test("accepts supported publication URLs and preserves case/slug IDs", () => {
  for (const host of ["fliphtml5.com", "www.fliphtml5.com", "online.fliphtml5.com"]) {
    assert.deepEqual(extractIdsFromUrl(` https://${host}/Author/pub-1/Title/?x=1#p=2 `), { id1: "Author", id2: "pub-1" });
  }
});

test("rejects arbitrary hosts, credentials, ports, malformed IDs and missing IDs", () => {
  for (const url of ["bad", "https://example.com/a/b", "https://fliphtml5.com.evil.test/a/b",
    "https://fliphtml5.com/a", "ftp://fliphtml5.com/a/b", "https://user@fliphtml5.com/a/b",
    "https://fliphtml5.com:1234/a/b", "https://fliphtml5.com/a/b%2Fc"]) {
    assert.equal(extractIdsFromUrl(url), null, url);
  }
});

test("resolves image, content-page, ZIP and absolute resource paths", () => {
  for (const [path, expected] of [
    ["1.jpg", `${base}files/large/1.jpg`],
    ["./files/large/1.jpg", `${base}files/large/1.jpg`],
    [".\\files\\large\\1.jpg", `${base}files/large/1.jpg`],
    ["1.zip", `${base}files/content-page/1.zip`],
    ["1.ZIP?token=fixture", `${base}files/content-page/1.ZIP?token=fixture`],
    ["files/content-page/1.zip", `${base}files/content-page/1.zip`],
    ["https://cdn.fliphtml5.com/1.jpg", "https://cdn.fliphtml5.com/1.jpg"],
  ]) assert.equal(buildPageUrl(path, base), expected);
  assert.throws(() => buildPageUrl("http://example.com/1.jpg", base), /Unsupported/);
});

test("parses JSON without running surrounding scripts or breaking on braces in strings", async () => {
  const title = 'A title with }; and "quotes" and \\ paths';
  const result = await parseBookConfig(
    `var prefix = {}; ${config({ fliphtml5_pages: pages, meta: { title, pageWidth: 600, pageHeight: 800 } })} throw new Error('never execute');`,
    "author", "publication",
  );
  assert.equal(result.title, title);
  assert.equal(result.width, 600);
  assert.equal(result.height, 800);
  assert.deepEqual(result.imageUrls, [`${base}files/large/1.jpg`]);
});

test("rejects private publications before invoking the public-config decoder", async () => {
  let decoded = false;
  await assert.rejects(parseBookConfig(config({ fliphtml5_pages: "encoded", loadingConfig: { isEncryptionBook: true } }),
    "author", "publication", async () => { decoded = true; return pages; }), /Private/);
  assert.equal(decoded, false);
});

test("uses the existing decoder for encoded public page lists", async () => {
  const result = await parseBookConfig(config({ fliphtml5_pages: "encoded" }), "author", "publication", async (value) => {
    assert.equal(value, "encoded"); return pages;
  });
  assert.equal(result.imageUrls.length, 1);
});

test("rejects missing/empty/broken pages and incomplete/non-JSON configuration", async () => {
  for (const value of [{}, { fliphtml5_pages: [] }, { fliphtml5_pages: [null] }, { fliphtml5_pages: [{ n: [] }] }]) {
    await assert.rejects(parseBookConfig(config(value), "author", "publication"), /valid pages/);
  }
  await assert.rejects(parseBookConfig("htmlConfig = {", "author", "publication"), /Incomplete/);
  await assert.rejects(parseBookConfig("htmlConfig = {notJson: 1};", "author", "publication"), SyntaxError);
  await assert.rejects(parseBookConfig("not a config", "author", "publication"), /parse/);
});

test("ignores invalid metadata dimensions", async () => {
  const result = await parseBookConfig(config({ fliphtml5_pages: pages, meta: { pageWidth: -1, pageHeight: "bad" } }), "a", "b");
  assert.equal(result.width, undefined);
  assert.equal(result.height, undefined);
});

test("fetches configuration directly without credentials, and checks HTTP status", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async (url: string, options: RequestInit) => {
    assert.equal(url, `${base}javascript/config.js`);
    assert.equal(options.credentials, "omit");
    return new Response(config({ fliphtml5_pages: pages }));
  });
  assert.equal((await loadBookConfig("author", "publication")).imageUrls.length, 1);
  fetchMock.mock.mockImplementation(async () => new Response("Not found", { status: 404 }));
  await assert.rejects(loadBookConfig("author", "publication"), /HTTP 404/);
});

test("reports CORS/network failures and propagates cancellation", async (t) => {
  t.mock.method(globalThis, "fetch", async () => { throw new TypeError("Failed to fetch"); });
  await assert.rejects(loadBookConfig("author", "publication"), /CORS/);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(loadBookConfig("author", "publication", controller.signal), /Failed to fetch/);
});
