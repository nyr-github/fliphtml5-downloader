import type * as PdfJs from "pdfjs-dist";

let pdfjsPromise: Promise<typeof PdfJs> | undefined;
async function ensurePdfjsLoaded() {
  pdfjsPromise ??= import("pdfjs-dist").then((pdfjs) => {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    return pdfjs;
  });
  return pdfjsPromise;
}

// Decode the same public page-resource format handled by the upstream project.
export async function getBlob(url: string, signal?: AbortSignal) {
  const response = await fetch(url, { signal, credentials: "omit" });
  if (!response.ok) throw new Error(`Page resource request failed (HTTP ${response.status}).`);
  const resource = await response.blob();
  if (resource.size <= 2086) throw new Error("Invalid page resource.");
  const pdfData = resource.slice(1083, resource.size - 1003, "application/pdf");
  const password = await resource.slice(1080, 1083).text() +
    await resource.slice(resource.size - 1003, resource.size - 1000).text();
  const header = new Uint8Array(await pdfData.slice(0, 4000).arrayBuffer());
  for (let i = 0; i < header.length; i++) header[i] = 255 - header[i];
  signal?.throwIfAborted();
  const pdf = new Blob([header, pdfData.slice(4000)], { type: "application/pdf" });
  return { url: URL.createObjectURL(pdf), password };
}

export async function extractPdfPages(pdfUrl: string, password: string, signal?: AbortSignal) {
  const lib = await ensurePdfjsLoaded();
  signal?.throwIfAborted();
  const loadingTask = lib.getDocument({ url: pdfUrl, password });
  const abort = () => { void loadingTask.destroy(); };
  signal?.addEventListener("abort", abort, { once: true });
  try {
    const pdf = await loadingTask.promise;
    const results: Array<{ data: string; w: number; h: number }> = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      signal?.throwIfAborted();
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas is unavailable in this browser.");
      await page.render({ canvasContext: context, viewport, canvas }).promise;
      results.push({ data: canvas.toDataURL("image/jpeg", 0.95), w: canvas.width, h: canvas.height });
      page.cleanup();
    }
    return results;
  } finally {
    signal?.removeEventListener("abort", abort);
    await loadingTask.destroy();
  }
}

export function isZipUrl(url: string): boolean {
  return new URL(url).pathname.toLowerCase().endsWith(".zip");
}
