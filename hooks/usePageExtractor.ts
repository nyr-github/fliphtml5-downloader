import { useState, useEffect, useCallback, useRef } from "react";
import { getBlob, extractPdfPages, isZipUrl } from "@/lib/pdf-handler";

/**
 * 自定义 Hook：处理页面提取（支持 ZIP 文件和普通图片）
 * @param pages 页面 URL 数组
 * @returns 提取的页面数据和加载状态
 */
export function usePageExtractor(pages: string[]) {
  const [extractedPages, setExtractedPages] = useState<Map<number, string>>(
    new Map(),
  );
  const [loadingPages, setLoadingPages] = useState<Set<number>>(new Set());

  // 使用 ref 来跟踪已提取和加载中的页面，避免依赖问题
  const extractedPagesRef = useRef<Map<number, string>>(new Map());
  const loadingPagesRef = useRef<Set<number>>(new Set());

  // 提取 ZIP 文件中的页面
  const extractZipPage = useCallback(
    async (pageIndex: number, pageUrl: string) => {
      // 使用 ref 检查，避免依赖问题
      if (
        extractedPagesRef.current.has(pageIndex) ||
        loadingPagesRef.current.has(pageIndex)
      ) {
        return;
      }

      setLoadingPages((prev) => new Set(prev).add(pageIndex));
      loadingPagesRef.current.add(pageIndex);

      try {
        const { url: pdfUrl, password } = await getBlob(pageUrl);
        const pdfPages = await extractPdfPages(pdfUrl, password);

        if (pdfPages.length > 0) {
          const imageData = pdfPages[0].data;
          extractedPagesRef.current.set(pageIndex, imageData);
          setExtractedPages((prev) => {
            const newMap = new Map(prev);
            newMap.set(pageIndex, imageData);
            return newMap;
          });
        }
      } catch (err) {
        console.error(`Failed to extract page ${pageIndex}:`, err);
      } finally {
        loadingPagesRef.current.delete(pageIndex);
        setLoadingPages((prev) => {
          const newSet = new Set(prev);
          newSet.delete(pageIndex);
          return newSet;
        });
      }
    },
    [],
  ); // 空依赖，因为使用 ref

  // 获取页面的显示 URL
  const getPageDisplayUrl = useCallback(
    (pageIndex: number): string | null => {
      if (pageIndex < 0 || pageIndex >= pages.length) {
        return null;
      }

      const pageUrl = pages[pageIndex];

      // 如果是 ZIP 文件，检查是否已提取
      if (isZipUrl(pageUrl)) {
        return extractedPages.get(pageIndex) || null;
      }

      // 否则直接返回原 URL
      return pageUrl;
    },
    [pages, extractedPages],
  );

  // 预加载指定页面（如果是 ZIP 文件）
  const preloadPages = useCallback(
    (pageIndices: number[]) => {
      pageIndices.forEach((idx) => {
        if (idx >= 0 && idx < pages.length) {
          const pageUrl = pages[idx];
          if (isZipUrl(pageUrl)) {
            extractZipPage(idx, pageUrl);
          }
        }
      });
    },
    [pages, extractZipPage],
  );

  return {
    extractedPages,
    loadingPages,
    extractZipPage,
    getPageDisplayUrl,
    preloadPages,
  };
}
