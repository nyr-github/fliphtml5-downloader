"use client";

import React, { useState, useEffect } from "react";
import { useBookConfig } from "@/hooks/useBookConfig";
import { usePageExtractor } from "@/hooks/usePageExtractor";
import {
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Package,
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import JSZip from "jszip";

interface PageThumbnailsProps {
  id1: string;
  id2: string;
}

export default function PageThumbnails({ id1, id2 }: PageThumbnailsProps) {
  const { config, loading, error } = useBookConfig(id1, id2);
  const pages = config?.pages || [];

  // 使用页面提取器处理 ZIP 文件
  const { getPageDisplayUrl, extractZipPage, loadingPages } =
    usePageExtractor(pages);

  const [selectedPageIndex, setSelectedPageIndex] = useState<number | null>(
    null,
  );
  const [downloading, setDownloading] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDownloadImage = async (imageUrl: string, pageIndex: number) => {
    try {
      setDownloading(true);
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `page-${pageIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download image:", err);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadAllAsZip = async () => {
    if (!config || config.pages.length === 0) return;

    try {
      setDownloadingZip(true);
      setZipProgress({ current: 0, total: config.pages.length });
      const zip = new JSZip();
      const folder = zip.folder("book-pages");

      // Download all images and add to zip with progress tracking
      for (let idx = 0; idx < config.pages.length; idx++) {
        try {
          const url = config.pages[idx];
          const response = await fetch(url);
          const blob = await response.blob();
          const fileName = `page-${String(idx + 1).padStart(3, "0")}.jpg`;
          folder?.file(fileName, blob);
          setZipProgress({ current: idx + 1, total: config.pages.length });
        } catch (err) {
          console.error(`Failed to download page ${idx + 1}:`, err);
        }
      }

      // Generate zip file
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipUrl = window.URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = zipUrl;
      link.download = `book-${id1}-${id2}-all-pages.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(zipUrl);
    } catch (err) {
      console.error("Failed to create ZIP:", err);
    } finally {
      setDownloadingZip(false);
      setZipProgress(null);
    }
  };

  // 预加载当前选中的页面（如果是 ZIP 文件）
  useEffect(() => {
    if (selectedPageIndex !== null && pages.length > 0) {
      const pageUrl = pages[selectedPageIndex];
      if (pageUrl.toLowerCase().endsWith(".zip")) {
        extractZipPage(selectedPageIndex, pageUrl);
      }
    }
  }, [selectedPageIndex, pages, extractZipPage]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (selectedPageIndex !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedPageIndex]);

  // Get visible pages based on expanded state
  const visiblePages = config?.pages.slice(0, isExpanded ? undefined : 6) || [];
  const visibleThumbnails =
    config?.thumbnails.slice(0, isExpanded ? undefined : 6) || [];
  const hasMorePages = config ? config.pages.length > 6 : false;

  // Handle keyboard events (Escape to close modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedPageIndex !== null) {
        setSelectedPageIndex(null);
      }
      // Arrow keys for navigation
      if (selectedPageIndex !== null) {
        if (e.key === "ArrowLeft" && selectedPageIndex > 0) {
          setSelectedPageIndex(selectedPageIndex - 1);
        }
        if (
          e.key === "ArrowRight" &&
          selectedPageIndex < config!.pages.length - 1
        ) {
          setSelectedPageIndex(selectedPageIndex + 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedPageIndex, config]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">
          Loading thumbnails...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 text-sm">
          Failed to load thumbnails: {error}
        </p>
      </div>
    );
  }

  if (!config || config.pages.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--color-text-muted)] text-sm">
          No thumbnails available
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Thumbnails Grid */}
      <div className="bg-white rounded-2xl border border-[var(--color-border-light)] shadow-sm p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap">
          <h2 className="text-lg font-display font-bold text-[var(--color-text)]">
            All Pages ({config.pages.length})
          </h2>
          <div className="flex items-center gap-3">
            {/* Download All Button */}
            <button
              onClick={handleDownloadAllAsZip}
              disabled={downloadingZip}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {downloadingZip ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {zipProgress
                      ? `Compressing ${zipProgress.current}/${zipProgress.total}`
                      : "Compressing..."}
                  </span>
                </>
              ) : (
                <>
                  <Package className="w-4 h-4" />
                  <span>Download All</span>
                </>
              )}
            </button>
            {/* Expand/Collapse Button */}
            {hasMorePages && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-[var(--color-text)] text-sm font-semibold rounded-lg transition-colors border border-[var(--color-border-light)] shadow-sm"
              >
                <span>{isExpanded ? "Show Less" : "Show All"}</span>
                <svg
                  className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {visibleThumbnails.map((url, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedPageIndex(idx)}
              className="relative aspect-[3/4] rounded-lg overflow-hidden transition-all duration-300 group hover:scale-[1.02] hover:shadow-lg"
            >
              <Image
                src={url}
                alt={`Page ${idx + 1}`}
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
                unoptimized
              />
              {/* Page Number Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
                <span className="text-white text-xs font-mono font-bold">
                  {idx + 1}
                </span>
              </div>
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* Full-Size Image Modal */}
      <AnimatePresence>
        {selectedPageIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center p-3 sm:p-4 backdrop-blur-md overflow-hidden"
            style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={() => setSelectedPageIndex(null)}
          >
            {/* Close Button */}
            <div className="absolute top-4 right-4 z-[10000] flex items-center gap-2">
              {/* Download Single Page */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (selectedPageIndex !== null) {
                    handleDownloadImage(
                      config.pages[selectedPageIndex],
                      selectedPageIndex,
                    );
                  }
                }}
                disabled={downloading}
                className="w-10 h-10 bg-black/50 backdrop-blur-sm hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                title="Download this page"
              >
                {downloading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
              </button>
              {/* Close */}
              <button
                onClick={() => setSelectedPageIndex(null)}
                className="w-10 h-10 bg-black/50 backdrop-blur-sm hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Page Counter */}
            <div className="absolute top-4 left-4 z-[10000]">
              <span className="text-white/80 text-sm font-mono font-bold bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                Page {selectedPageIndex + 1} of {config.pages.length}
              </span>
            </div>

            {/* Full-Size Image */}
            <motion.div
              key={selectedPageIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.2 }}
              className="relative w-full h-full max-w-5xl max-h-[80vh] flex items-center justify-center px-4 sm:px-0"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const displayUrl = getPageDisplayUrl(selectedPageIndex);
                const pageUrl = config.pages[selectedPageIndex];
                const isZip = pageUrl.toLowerCase().endsWith(".zip");
                const isLoading = isZip && !displayUrl;

                if (isLoading) {
                  return (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-12 h-12 text-[var(--color-primary)] animate-spin" />
                    </div>
                  );
                }

                if (!displayUrl) {
                  return null;
                }

                return (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Image
                      src={displayUrl}
                      alt={`Page ${selectedPageIndex + 1}`}
                      fill
                      className="object-contain"
                      referrerPolicy="no-referrer"
                      unoptimized
                      priority
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 70vw"
                    />
                  </div>
                );
              })()}
            </motion.div>

            {/* Navigation Buttons */}
            {selectedPageIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPageIndex(selectedPageIndex - 1);
                }}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-[10000] w-10 h-10 sm:w-12 sm:h-12 bg-black/50 backdrop-blur-sm hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}

            {selectedPageIndex < config.pages.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPageIndex(selectedPageIndex + 1);
                }}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-[10000] w-10 h-10 sm:w-12 sm:h-12 bg-black/50 backdrop-blur-sm hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
