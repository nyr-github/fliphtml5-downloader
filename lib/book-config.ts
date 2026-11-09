import { decryptPages } from "./decryption";
import type { FlipConfig, FlipPage } from "./types";

const HOSTS = new Set(["fliphtml5.com", "www.fliphtml5.com", "online.fliphtml5.com"]);
const ID = /^[a-zA-Z0-9_-]+$/;

export function extractIdsFromUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (!HOSTS.has(url.hostname) || !["https:", "http:"].includes(url.protocol) ||
        url.username || url.password || url.port) return null;
    const [id1, id2] = url.pathname.split("/").filter(Boolean);
    return id1 && id2 && ID.test(id1) && ID.test(id2) ? { id1, id2 } : null;
  } catch {
    return null;
  }
}

// Read the JSON assignment without executing JavaScript from a remote publication.
function parseConfig(text: string): FlipConfig {
  const match = /\bhtmlConfig\s*=\s*\{/.exec(text);
  if (!match) throw new Error("Could not parse publication configuration.");
  const start = match.index + match[0].length - 1;
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === "{") depth++;
    else if (char === "}" && --depth === 0) return JSON.parse(text.slice(start, i + 1));
  }
  throw new Error("Incomplete publication configuration.");
}

export function buildPageUrl(path: string, base: string): string {
  let relative = path.replace(/\\/g, "/").replace(/^(\.\/|\/)+/, "");
  if (!/^https?:\/\//i.test(relative) && !relative.startsWith("files/")) {
    const zipped = relative.split(/[?#]/)[0].toLowerCase().endsWith(".zip");
    relative = `${zipped ? "files/content-page" : "files/large"}/${relative}`;
  }
  const url = new URL(relative, base);
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error("Unsupported page resource URL.");
  }
  return url.href;
}

export async function parseBookConfig(
  text: string,
  id1: string,
  id2: string,
  decode: (value: string) => Promise<FlipPage[]> = decryptPages,
) {
  const config = parseConfig(text);
  // Preserve upstream's private-publication restriction, before loading its decoder.
  if (config.loadingConfig?.isEncryptionBook) {
    throw new Error("Private or password-protected publications are not supported.");
  }
  const pages = typeof config.fliphtml5_pages === "string"
    ? await decode(config.fliphtml5_pages) : config.fliphtml5_pages;
  if (!Array.isArray(pages) || pages.length === 0 || pages.some(
    (page) => !page || !Array.isArray(page.n) || typeof page.n[0] !== "string" || !page.n[0],
  )) throw new Error("No valid pages found in this publication.");

  const base = `https://online.fliphtml5.com/${id1}/${id2}/`;
  const width = Number(config.meta?.pageWidth);
  const height = Number(config.meta?.pageHeight);
  return {
    imageUrls: pages.map((page) => buildPageUrl(page.n[0], base)),
    title: typeof config.meta?.title === "string" && config.meta.title.trim() ? config.meta.title : id2,
    width: Number.isFinite(width) && width > 0 ? width : undefined,
    height: Number.isFinite(height) && height > 0 ? height : undefined,
  };
}

export async function loadBookConfig(id1: string, id2: string, signal?: AbortSignal) {
  if (!ID.test(id1) || !ID.test(id2)) throw new Error("Invalid publication IDs.");
  let response: Response;
  try {
    response = await fetch(`https://online.fliphtml5.com/${id1}/${id2}/javascript/config.js`, {
      signal, credentials: "omit",
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error("Could not fetch configuration. Check your network and source CORS permissions; no proxy is configured.");
  }
  if (!response.ok) throw new Error(`Configuration request failed (HTTP ${response.status}).`);
  return parseBookConfig(await response.text(), id1, id2);
}
