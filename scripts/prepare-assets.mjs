import { copyFile } from "node:fs/promises";

// Serve the PDF.js worker locally, at exactly the same installed version.
await copyFile(
  new URL("../node_modules/pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url),
  new URL("../public/pdf.worker.min.mjs", import.meta.url),
);
