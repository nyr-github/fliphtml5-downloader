import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { PDFDocument } from "pdf-lib";
import { jsPDF } from "jspdf";

// Every remote response is synthetic. No actual publication is contacted.
const baseURL = process.env.TEST_BASE_URL || "http://127.0.0.1:10022";
const output = new URL("../test-results/", import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}) });
const unexpected = [];
const apiRequests = [];
const errors = [];
let broken = true;
let releaseSlow;
let slowRequested;
const slowStarted = new Promise((resolve) => { slowRequested = resolve; });
const slowReleased = new Promise((resolve) => { releaseSlow = resolve; });
const publicPages = [{ n: ["1.jpg"] }, { n: ["2.jpg"] }];
const configFor = (id) => ({
  meta: { title: `Synthetic ${id}` },
  loadingConfig: { isEncryptionBook: id === "private" },
  fliphtml5_pages: id === "encoded" ? "test-only-encoded-data" : id === "zip" ? [{ n: ["1.zip"] }] : publicPages,
});
const fixturePdf = new jsPDF({ unit: "px", format: [200, 300], hotfixes: ["px_scaling"] });
fixturePdf.setFillColor(240, 150, 30);
fixturePdf.rect(0, 0, 200, 300, "F");
const pdfBytes = new Uint8Array(fixturePdf.output("arraybuffer"));
const envelope = new Uint8Array(1083 + pdfBytes.length + 1003);
envelope.set(new TextEncoder().encode("abc"), 1080);
envelope.set(pdfBytes.map((byte, index) => index < 4000 ? 255 - byte : byte), 1083);
envelope.set(new TextEncoder().encode("def"), envelope.length - 1003);

async function intercept(context) {
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith("/api/")) apiRequests.push(url.href);
    if (url.origin === baseURL) { await route.continue(); return; }
    if (url.hostname === "static.fliphtml5.com" && url.pathname.endsWith("jquery-4.0.0.min.js")) {
      await route.fulfill({ contentType: "application/javascript", body: "// synthetic fixture" }); return;
    }
    if (url.hostname === "static.fliphtml5.com" && url.pathname.endsWith("deString.js")) {
      await route.fulfill({ contentType: "application/javascript", body:
        `window.decoderPrematureCalls=0;window.decoderAllocations=0;
         window.Module={isReady:false,_DeString:()=>2};
         window.allocateUTF8=()=>{
           if(!window.Module.isReady){window.decoderPrematureCalls++;throw new Error('malloc called before runtime initialization');}
           window.decoderAllocations++;return 1;
         };
         window.UTF8ToString=()=>${JSON.stringify(JSON.stringify(publicPages))};
         setTimeout(()=>{window.Module.isReady=true;},250);` }); return;
    }
    const match = /^\/fixture\/([^/]+)\/(.*)$/.exec(url.pathname);
    if (url.hostname !== "online.fliphtml5.com" || !match) {
      unexpected.push(url.href); await route.abort(); return;
    }
    const [, id, path] = match;
    const headers = { "access-control-allow-origin": "*" };
    if (path === "javascript/config.js") {
      await route.fulfill({ headers, status: id === "missing" ? 404 : 200, contentType: "text/javascript",
        body: `window.htmlConfig = ${JSON.stringify(configFor(id))};` }); return;
    }
    if (id === "slow") {
      slowRequested();
      await slowReleased;
    }
    if (id === "broken" && broken && path.endsWith("2.jpg")) {
      await route.fulfill({ headers, status: 404, body: "Synthetic failure" }); return;
    }
    if (path.endsWith(".zip")) {
      await route.fulfill({ headers, contentType: "application/octet-stream", body: Buffer.from(envelope) }); return;
    }
    const first = path.endsWith("1.jpg");
    const [width, height, fill, label] = first ? [200, 300, "#ee5555", "Synthetic page 1"] : [400, 200, "#4488ee", "Synthetic page 2"];
    try {
      await route.fulfill({ headers, contentType: "image/svg+xml", body:
        `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${fill}"/><text x="12" y="40" font-family="sans-serif" font-size="18" fill="white">${label}</text></svg>` });
    } catch (error) {
      if (id !== "slow") throw error; // Expected if the browser cancelled the held request.
    }
  });
}

async function convert(page, id) {
  await page.getByLabel("Publication URL", { exact: true }).fill(`https://fliphtml5.com/fixture/${id}/`);
  await page.getByRole("button", { name: "Convert to PDF", exact: true }).click();
  return page.getByRole("article").filter({ has: page.getByRole("heading", { name: `Synthetic ${id}`, exact: true }) });
}

async function savePdf(card, name, expectedPages) {
  await card.getByRole("link", { name: "Download PDF", exact: true }).waitFor();
  const page = card.page();
  const waiting = page.waitForEvent("download");
  await card.getByRole("link", { name: "Download PDF", exact: true }).click();
  const download = await waiting;
  const target = new URL(name, output);
  await download.saveAs(fileURLToPath(target));
  const pdf = await PDFDocument.load(await readFile(target));
  assert.equal(pdf.getPageCount(), expectedPages);
  return pdf;
}

try {
  const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 900 } });
  await intercept(context);
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(baseURL);
  await page.getByLabel("Publication URL", { exact: true }).waitFor();
  await page.screenshot({ path: fileURLToPath(new URL("desktop.png", output)), fullPage: true });
  await page.getByLabel("Publication URL", { exact: true }).fill("https://example.com/author/publication");
  await page.getByRole("button", { name: "Convert to PDF", exact: true }).click();
  await page.getByText("Enter a valid FlipHTML5 publication URL.", { exact: true }).waitFor();
  assert.equal(await page.getByRole("article").count(), 0);

  const images = await convert(page, "images");
  const pdf = await savePdf(images, "synthetic-images.pdf", 2);
  assert.deepEqual(pdf.getPages().map((p) => [p.getWidth(), p.getHeight()]), [[150, 225], [300, 150]]);
  await page.screenshot({ path: fileURLToPath(new URL("complete.png", output)), fullPage: true });
  console.log("PASS image conversion, ordered page dimensions, download, and no application API");

  await page.reload();
  await page.getByRole("button", { name: "Start conversion", exact: true }).waitFor();
  assert.equal(await page.getByRole("link", { name: "Download PDF", exact: true }).count(), 0);
  await page.getByRole("button", { name: "Clear tasks", exact: true }).click();
  await page.getByRole("article").waitFor({ state: "detached" });
  assert.equal(await page.getByRole("article").count(), 0);
  assert.equal(await page.evaluate(() => localStorage.getItem("fliphtml5-local-tasks-v1")), "[]");
  console.log("PASS refresh restoration and local history removal");

  const failure = await convert(page, "broken");
  await failure.getByRole("alert").filter({ hasText: "Page 2 failed" }).waitFor();
  assert.equal(await failure.getByRole("link", { name: "Download PDF", exact: true }).count(), 0);
  broken = false;
  await failure.getByRole("button", { name: "Retry conversion", exact: true }).click();
  await savePdf(failure, "synthetic-retry.pdf", 2);
  console.log("PASS failed pages never produce a partial PDF; retry succeeds");

  await convert(page, "private");
  await page.getByRole("alert").filter({ hasText: "Private or password-protected" }).waitFor();
  await convert(page, "missing");
  await page.getByRole("alert").filter({ hasText: "HTTP 404" }).waitFor();
  console.log("PASS private-publication rejection and configuration HTTP errors");

  const zipped = await convert(page, "zip");
  await savePdf(zipped, "synthetic-resource.pdf", 1);
  console.log("PASS ZIP/PDF envelope decoding and local PDF.js worker");

  const encoded = await convert(page, "encoded");
  await savePdf(encoded, "synthetic-encoded.pdf", 2);
  assert.deepEqual(await page.evaluate(() => ({ premature: window.decoderPrematureCalls, allocations: window.decoderAllocations })),
    { premature: 0, allocations: 1 });
  console.log("PASS encoded public-config flow waits for delayed WASM startup without premature allocation");

  const slow = await convert(page, "slow");
  await slowStarted;
  await slow.getByRole("button", { name: "Cancel", exact: true }).click();
  await slow.getByRole("button", { name: "Start conversion", exact: true }).waitFor();
  releaseSlow();
  assert.equal(await slow.getByRole("link", { name: "Download PDF", exact: true }).count(), 0);
  console.log("PASS cancellation prevents PDF output");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: fileURLToPath(new URL("mobile.png", output)), fullPage: true });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await context.close();

  const privateContext = await browser.newContext();
  await intercept(privateContext);
  await privateContext.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error("Storage unavailable"); };
    Storage.prototype.setItem = () => { throw new Error("Storage unavailable"); };
  });
  const privatePage = await privateContext.newPage();
  privatePage.on("pageerror", (error) => errors.push(error.message));
  await privatePage.goto(baseURL);
  const memoryOnly = await convert(privatePage, "images");
  await memoryOnly.getByRole("link", { name: "Download PDF", exact: true }).waitFor();
  await privateContext.close();
  console.log("PASS mobile layout and conversion with browser storage disabled");

  assert.deepEqual(unexpected, [], "Unexpected external request");
  assert.deepEqual(apiRequests, [], "Application backend request");
  assert.deepEqual(errors, [], "Browser runtime error");
  console.log("All browser checks passed using synthetic fixtures only.");
} finally {
  releaseSlow();
  await browser.close();
}
