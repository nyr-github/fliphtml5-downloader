import { useState, useEffect, useCallback } from "react";
import { FlipPage, FlipConfig } from "@/lib/types";
import { decryptPages } from "@/lib/decryption";

export interface BookConfig {
  pages: string[];
  title: string;
  pageCount: number;
  thumbnail?: string;
  id1: string;
  id2: string;
}

/**
 * 加载并解析 FlipHTML5 书籍配置
 */
export async function loadBookConfig(
  id1: string,
  id2: string,
): Promise<{
  config: FlipConfig;
  pages: FlipPage[];
  imageUrls: string[];
  bookTitle: string;
  firstPageThumb?: string;
}> {
  const configUrl = `https://online.fliphtml5.com/${id1}/${id2}/javascript/config.js`;
  const res = await fetch(configUrl);
  const text = await res.text();

  // Extract json from the config.js file
  // Usually it's window.htmlConfig = {...};
  const jsonMatch = text.match(/htmlConfig\s*=\s*({[\s\S]*?});/);
  if (!jsonMatch) throw new Error("Could not parse book configuration");

  const config: FlipConfig = JSON.parse(jsonMatch[1]);
  let pageData: FlipPage[] = [];

  if (typeof config.fliphtml5_pages === "string") {
    pageData = await decryptPages(config.fliphtml5_pages);
  } else {
    pageData = config.fliphtml5_pages;
  }

  const baseUrl = `https://online.fliphtml5.com/${id1}/${id2}/`;
  console.log(pageData);
  debugger;
  const imageUrls = pageData.map((p) => {
    const relativePath = p.n[0]
      .replace(/\\/g, "/")
      .replace("files/large/", "")
      .replace("./", "");
    return baseUrl + "files/large/" + relativePath;
  });

  return {
    config,
    pages: pageData,
    imageUrls,
    bookTitle: config.meta?.title || id2,
    firstPageThumb: pageData[0]?.t,
  };
}

export function useBookConfig(id1: string, id2: string) {
  const [config, setConfig] = useState<BookConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBookConfigWrapper = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await loadBookConfig(id1, id2);

      setConfig({
        pages: result.imageUrls,
        title: result.bookTitle,
        pageCount: result.pages.length,
        thumbnail: result.firstPageThumb,
        id1,
        id2,
      });
      setLoading(false);
    } catch (err: any) {
      console.error("Error loading book config:", err);
      setError(err.message);
      setLoading(false);
    }
  }, [id1, id2]);

  useEffect(() => {
    if (id1 && id2) {
      loadBookConfigWrapper();
    }
  }, [id1, id2, loadBookConfigWrapper]);

  return { config, loading, error, reload: loadBookConfigWrapper };
}

export function extractIdsFromUrl(urlStr: string) {
  try {
    const urlObj = new URL(urlStr.trim());
    const pathParts = urlObj.pathname.split("/").filter((p) => p !== "");
    if (pathParts.length >= 2) {
      return { id1: pathParts[0], id2: pathParts[1] };
    }
    return null;
  } catch {
    return null;
  }
}
