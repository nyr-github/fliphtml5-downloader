import type { FlipPage } from "./types";

const scriptLoads = new Map<string, Promise<void>>();

// Share in-flight loads so concurrent tasks cannot initialize the decoder out of order.
export function loadScript(src: string): Promise<void> {
  if (typeof document === "undefined") return Promise.reject(new Error("A browser is required."));
  const existing = scriptLoads.get(src);
  if (existing) return existing;
  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    const timer = setTimeout(() => {
      script.remove();
      reject(new Error("Public-config decoder script timed out."));
    }, 15000);
    script.src = src;
    script.async = true;
    script.onload = () => { clearTimeout(timer); resolve(); };
    script.onerror = () => {
      clearTimeout(timer);
      script.remove();
      reject(new Error("Could not load the public-config decoder."));
    };
    document.body.appendChild(script);
  }).catch((error) => {
    scriptLoads.delete(src);
    throw error;
  });
  scriptLoads.set(src, promise);
  return promise;
}

export async function decryptPages(encoded: string): Promise<FlipPage[]> {
  await loadScript("https://static.fliphtml5.com/resourceFiles/html5_templates/js/jquery-4.0.0.min.js");
  await loadScript("https://static.fliphtml5.com/resourceFiles/html5_templates/js/deString.js");
  const start = Date.now();
  while (Date.now() - start < 15000) {
    // Emscripten exports wrappers before WASM startup has completed. The official
    // decoder sets isReady in onRuntimeInitialized; calling malloc earlier aborts it.
    if (window.Module?.isReady === true && window.allocateUTF8 && window.Module._DeString && window.UTF8ToString) {
      const input = window.allocateUTF8(encoded);
      const output = window.Module._DeString(input);
      let decoded = window.UTF8ToString(output);
      const end = decoded.lastIndexOf("]");
      if (end > 0) decoded = decoded.slice(0, end + 1);
      return JSON.parse(decoded);
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Public-config decoder timed out. Check your network and retry.");
}
