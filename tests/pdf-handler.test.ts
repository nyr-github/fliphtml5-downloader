import assert from "node:assert/strict";
import test from "node:test";
import { getBlob, isZipUrl } from "../lib/pdf-handler";

test("recognizes ZIP resources with query strings and mixed case", () => {
  assert.equal(isZipUrl("https://example.com/1.ZIP?token=x#page=1"), true);
  assert.equal(isZipUrl("https://example.com/1.jpg?name=1.zip"), false);
});

test("decodes the upstream public resource envelope", async (t) => {
  const pdf = new TextEncoder().encode("%PDF-test-only");
  const bytes = new Uint8Array(1083 + pdf.length + 1003);
  bytes.set(new TextEncoder().encode("abc"), 1080);
  bytes.set(pdf.map((value) => 255 - value), 1083);
  bytes.set(new TextEncoder().encode("def"), bytes.length - 1003);
  const nativeFetch = globalThis.fetch;
  t.mock.method(globalThis, "fetch", async (_url: string, options: RequestInit) => {
    assert.equal(options.credentials, "omit");
    return new Response(bytes);
  });
  const result = await getBlob("https://example.com/1.zip");
  try {
    assert.equal(result.password, "abcdef");
    assert.deepEqual(new Uint8Array(await (await nativeFetch(result.url)).arrayBuffer()), pdf);
    assert.ok(result.url.startsWith("blob:"));
  } finally { URL.revokeObjectURL(result.url); }
});

test("rejects bad HTTP status and malformed resource envelopes", async (t) => {
  const mock = t.mock.method(globalThis, "fetch", async () => new Response("bad", { status: 403 }));
  await assert.rejects(getBlob("https://example.com/1.zip"), /HTTP 403/);
  mock.mock.mockImplementation(async () => new Response("tiny"));
  await assert.rejects(getBlob("https://example.com/1.zip"), /Invalid/);
});
