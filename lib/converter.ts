import { jsPDF } from "jspdf";
import { loadBookConfig } from "./book-config";
import { extractPdfPages, getBlob, isZipUrl } from "./pdf-handler";

interface PageImage { data: string; w: number; h: number }
export interface ConversionProgress {
  title: string;
  currentPage: number;
  totalPages: number;
  progress: number;
}

async function fetchImage(url: string, signal: AbortSignal): Promise<PageImage> {
  const response = await fetch(url, { signal, credentials: "omit" });
  if (!response.ok) throw new Error(`Page request failed (HTTP ${response.status}).`);
  const blobUrl = URL.createObjectURL(await response.blob());
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      const cleanup = () => signal.removeEventListener("abort", abort);
      const abort = () => {
        cleanup();
        image.src = "";
        reject(new DOMException("Conversion cancelled", "AbortError"));
      };
      image.onload = () => { cleanup(); resolve(); };
      image.onerror = () => { cleanup(); reject(new Error("Could not decode page image.")); };
      if (signal.aborted) { abort(); return; }
      signal.addEventListener("abort", abort, { once: true });
      image.src = blobUrl;
    });
    signal.throwIfAborted();
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable in this browser.");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);
    return { data: canvas.toDataURL("image/jpeg", 0.95), w: canvas.width, h: canvas.height };
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

export async function convertPublication(
  id1: string,
  id2: string,
  signal: AbortSignal,
  onProgress: (progress: ConversionProgress) => void,
): Promise<{ blob: Blob; title: string }> {
  const config = await loadBookConfig(id1, id2, signal);
  const totalPages = config.imageUrls.length;
  let pdf: jsPDF | undefined;
  const report = (currentPage: number) => onProgress({
    title: config.title, currentPage, totalPages, progress: currentPage / totalPages * 100,
  });
  report(0);

  for (const [index, url] of config.imageUrls.entries()) {
    signal.throwIfAborted();
    let images: PageImage[];
    try {
      if (isZipUrl(url)) {
        const resource = await getBlob(url, signal);
        try {
          images = await extractPdfPages(resource.url, resource.password, signal);
        } finally {
          URL.revokeObjectURL(resource.url);
        }
      } else {
        images = [await fetchImage(url, signal)];
      }
    } catch (error) {
      if (signal.aborted) throw error;
      const reason = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Page ${index + 1} failed: ${reason} Check source access/CORS permissions. No incomplete PDF was saved.`);
    }
    for (const image of images) {
      signal.throwIfAborted();
      const width = config.width && config.height ? config.width : image.w;
      const height = config.width && config.height ? config.height : image.h;
      const orientation = width > height ? "l" : "p";
      if (!pdf) {
        pdf = new jsPDF({ unit: "px", format: [width, height], orientation, hotfixes: ["px_scaling"] });
      } else {
        pdf.addPage([width, height], orientation);
      }
      pdf.addImage(image.data, "JPEG", 0, 0, width, height);
    }
    report(index + 1);
  }
  signal.throwIfAborted();
  if (!pdf) throw new Error("No pages could be converted.");
  return { blob: pdf.output("blob"), title: config.title };
}
