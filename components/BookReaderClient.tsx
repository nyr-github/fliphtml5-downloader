"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  Minimize2,
  Loader2,
  Download,
  Info,
  Grid3X3,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  BookOpen,
  FileText,
  Share2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useBookConfig } from "@/hooks/useBookConfig";
import { usePageExtractor } from "@/hooks/usePageExtractor";
import { isZipUrl } from "@/lib/pdf-handler";
import {
  readingProgressDB,
  isIndexedDBSupported,
} from "@/lib/reading-progress-db";

export default function BookReaderClient({
  dbId,
  id1,
  id2,
  title,
  from,
}: {
  dbId: string;
  id1: string;
  id2: string;
  title: string;
  from?: string;
}) {
  const { config, loading, error } = useBookConfig(id1, id2);
  const pages = config?.pages || [];
  const thumbnails = config?.thumbnails || [];

  // 使用页面提取器处理 ZIP 文件
  const { getPageDisplayUrl, extractZipPage, loadingPages } =
    usePageExtractor(pages);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [isZoomed, setIsZoomed] = useState(false);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isDualPageMode, setIsDualPageMode] = useState(false);
  const [isWideScreen, setIsWideScreen] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [downloadingPage, setDownloadingPage] = useState(false);
  const [touchStartDistance, setTouchStartDistance] = useState(0);
  const [touchStartZoom, setTouchStartZoom] = useState(100);
  const [isRestoringProgress, setIsRestoringProgress] = useState(true);
  const [progressEnabled, setProgressEnabled] = useState(false);

  // 触摸滑动相关状态
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  // 检测 IndexedDB 支持情况
  useEffect(() => {
    const supported = isIndexedDBSupported();
    setProgressEnabled(supported);
    if (!supported) {
      console.log(
        "Reading progress feature is disabled: IndexedDB not supported",
      );
      setIsRestoringProgress(false);
    }
  }, []);

  const readerRef = useRef<HTMLDivElement>(null);
  const thumbnailPanelRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const bookUrl = `https://fliphtml5.com/${id1}/${id2}`;
  const downloadUrl = `/?url=${encodeURIComponent(bookUrl)}#downloader-section`;
  const shareUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `${process.env.NEXT_PUBLIC_BASE_URL || "https://yourdomain.com"}/read/${dbId}`;

  // 返回链接：如果有 from 参数，返回到对应页面，否则默认返回到书籍详情页
  const backUrl = from === "history" ? "/history" : `/book/${dbId}`;

  // 预加载当前页和下一页（如果是 ZIP 文件）
  useEffect(() => {
    // 在恢复进度期间不预加载，避免加载错误的页面
    if (isRestoringProgress) return;

    const pagesToLoad = [currentIndex, currentIndex + 1].filter(
      (idx) => idx < pages.length,
    );
    pagesToLoad.forEach((idx) => {
      const pageUrl = pages[idx];
      if (isZipUrl(pageUrl)) {
        extractZipPage(idx, pageUrl);
      }
    });
  }, [currentIndex, pages, extractZipPage, isRestoringProgress]);

  // 恢复阅读进度
  useEffect(() => {
    // 如果不支持 IndexedDB，跳过进度恢复
    if (!progressEnabled) {
      return;
    }

    const restoreProgress = async () => {
      if (!dbId || pages.length === 0) {
        setIsRestoringProgress(false);
        return;
      }

      try {
        const progress = await readingProgressDB.getProgress(dbId);
        if (
          progress &&
          progress.currentPage >= 0 &&
          progress.currentPage < pages.length
        ) {
          setCurrentIndex(progress.currentPage);
        }
      } catch (err) {
        console.error("Failed to restore reading progress:", err);
      } finally {
        setIsRestoringProgress(false);
      }
    };

    restoreProgress();
  }, [dbId, pages.length, progressEnabled]);

  // 保存阅读进度（当页面变化时）
  useEffect(() => {
    // 如果不支持 IndexedDB，跳过进度保存
    if (!progressEnabled) {
      return;
    }

    if (!dbId || pages.length === 0 || isRestoringProgress) return;

    const saveProgress = async () => {
      try {
        await readingProgressDB.saveProgress({
          bookId: dbId,
          currentPage: currentIndex,
          totalPages: pages.length,
          title: title,
          id1: id1,
          id2: id2,
          thumbnail: thumbnails[0] || "",
          lastReadAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Failed to save reading progress:", err);
      }
    };

    // 使用防抖，避免频繁写入
    const timeoutId = setTimeout(saveProgress, 500);
    return () => clearTimeout(timeoutId);
  }, [
    currentIndex,
    dbId,
    pages.length,
    title,
    id1,
    id2,
    thumbnails,
    isRestoringProgress,
    progressEnabled,
  ]);

  // 当缩略图面板打开时，批量预加载所有 ZIP 页面
  useEffect(() => {
    if (showThumbnails && pages.length > 0) {
      // 找到所有未加载的 ZIP 页面
      const zipPagesToLoad = pages
        .map((url, idx) => ({ url, idx }))
        .filter(({ url, idx }) => isZipUrl(url) && !getPageDisplayUrl(idx));

      // 限制并发数量，避免同时加载太多
      const batchSize = 3;
      const loadBatch = async (startIndex: number) => {
        const batch = zipPagesToLoad.slice(startIndex, startIndex + batchSize);
        await Promise.all(
          batch.map(({ idx, url }) => extractZipPage(idx, url)),
        );

        if (startIndex + batchSize < zipPagesToLoad.length) {
          // 递归加载下一批
          setTimeout(() => loadBatch(startIndex + batchSize), 100);
        }
      };

      if (zipPagesToLoad.length > 0) {
        loadBatch(0);
      }
    }
  }, [showThumbnails, pages, extractZipPage, getPageDisplayUrl]);

  // 获取当前显示的页面索引数组
  const getCurrentPageIndices = useCallback(() => {
    if (!isDualPageMode || currentIndex === 0 || pages.length <= 1) {
      return [currentIndex];
    }

    // 双页模式：从第二页开始双页显示
    // 封面(索引0)单独显示
    // 从索引1开始，每两页一组：(1,2), (3,4), (5,6)...
    // currentIndex 是奇数时，显示 currentIndex 和 currentIndex+1
    // currentIndex 是偶数时，显示 currentIndex-1 和 currentIndex
    if (currentIndex % 2 === 1) {
      // 奇数索引：显示当前页和下一页
      return [currentIndex, Math.min(currentIndex + 1, pages.length - 1)];
    } else {
      // 偶数索引：显示上一页和当前页
      return [currentIndex - 1, currentIndex];
    }
  }, [currentIndex, isDualPageMode, pages.length]);

  const nextPage = useCallback(() => {
    if (currentIndex < pages.length - 1) {
      // 双页模式下：
      // - 在封面(0)时，跳到第1页（会与第2页组成双页，显示索引1和2）
      // - 在其他位置时，每次跳2页
      if (isDualPageMode) {
        if (currentIndex === 0) {
          setCurrentIndex(1);
        } else {
          setCurrentIndex((prev) => Math.min(prev + 2, pages.length - 1));
        }
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    }
  }, [currentIndex, pages.length, isDualPageMode]);

  const prevPage = useCallback(() => {
    if (currentIndex > 0) {
      // 双页模式下：
      // - 在第1页或第2页时（索引1或2），回到封面(0)
      // - 在其他位置时，每次跳2页
      if (isDualPageMode) {
        if (currentIndex <= 2) {
          setCurrentIndex(0);
        } else {
          setCurrentIndex((prev) => Math.max(prev - 2, 1));
        }
      } else {
        setCurrentIndex((prev) => prev - 1);
      }
    }
  }, [currentIndex, isDualPageMode]);

  const handleZoomIn = useCallback(() => {
    // 双页模式下不允许缩放
    if (isDualPageMode && currentIndex > 0) return;

    setZoom((prev) => {
      const newZoom = Math.min(300, prev + 25);
      setIsZoomed(newZoom > 100);
      return newZoom;
    });
  }, [isDualPageMode, currentIndex]);

  const handleZoomOut = useCallback(() => {
    // 双页模式下不允许缩放
    if (isDualPageMode && currentIndex > 0) return;

    setZoom((prev) => {
      const newZoom = Math.max(25, prev - 25);
      if (newZoom <= 100) {
        setIsZoomed(false);
        setPanPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  }, [isDualPageMode, currentIndex]);

  const handleResetZoom = useCallback(() => {
    setZoom(100);
    setIsZoomed(false);
    setPanPosition({ x: 0, y: 0 });
  }, []);

  // 计算两个触摸点之间的距离
  const getTouchDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // 处理触摸开始（双指手势）
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      setTouchStartDistance(distance);
      setTouchStartZoom(zoom);
    } else if (e.touches.length === 1 && !isZoomed) {
      // 单指触摸且未缩放时，记录起始位置用于滑动
      setTouchStartX(e.touches[0].clientX);
      setTouchStartY(e.touches[0].clientY);
      setIsSwiping(true);
    }
  };

  // 处理触摸移动（双指缩放）
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / touchStartDistance;
      const newZoom = Math.min(300, Math.max(25, touchStartZoom * scale));
      setZoom(newZoom);
      setIsZoomed(newZoom > 100);
    }
  };

  // 处理触摸结束（滑动翻页）
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      setTouchStartDistance(0);
      setTouchStartZoom(100);
    }

    // 处理滑动翻页
    if (isSwiping && e.changedTouches.length === 1) {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      // 判断是否为水平滑动（水平移动距离大于垂直移动距离）
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          // 向右滑动，上一页
          prevPage();
        } else {
          // 向左滑动，下一页
          nextPage();
        }
      }

      setIsSwiping(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextPage();
      if (e.key === "ArrowLeft") prevPage();
      if (e.key === "Escape" && isFullscreen) setIsFullscreen(false);
      // 双页模式下禁用缩放快捷键
      if (!(isDualPageMode && currentIndex > 0)) {
        if (e.key === "+" || e.key === "=") handleZoomIn();
        if (e.key === "-") handleZoomOut();
        if (e.key === "0" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          handleResetZoom();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    nextPage,
    prevPage,
    isFullscreen,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    isDualPageMode,
    currentIndex,
  ]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      // 双页模式下禁用滚轮缩放
      if (isDualPageMode && currentIndex > 0) return;

      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          handleZoomIn();
        } else {
          handleZoomOut();
        }
      }
    },
    [handleZoomIn, handleZoomOut, isDualPageMode, currentIndex],
  );

  const handleImageMouseDown = (e: React.MouseEvent) => {
    if (isZoomed && e.button === 0) {
      e.preventDefault();
      e.stopPropagation();
      setIsPanning(true);
      setPanStart({
        x: e.clientX - panPosition.x,
        y: e.clientY - panPosition.y,
      });
    }
  };

  // 触摸拖动（单指）
  const handleTouchStartPan = (e: React.TouchEvent) => {
    if (isZoomed && e.touches.length === 1) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({
        x: e.touches[0].clientX - panPosition.x,
        y: e.touches[0].clientY - panPosition.y,
      });
    }
  };

  const handleTouchMovePan = (e: React.TouchEvent) => {
    if (isPanning && e.touches.length === 1) {
      e.preventDefault();
      const newX = e.touches[0].clientX - panStart.x;
      const newY = e.touches[0].clientY - panStart.y;
      setPanPosition({ x: newX, y: newY });
    }
  };

  const handleTouchEndPan = () => {
    setIsPanning(false);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        e.preventDefault();
        const newX = e.clientX - panStart.x;
        const newY = e.clientY - panStart.y;
        setPanPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsPanning(false);
    };

    if (isPanning) {
      document.addEventListener("mousemove", handleMouseMove, {
        passive: false,
      });
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isPanning, panStart]);

  // Reset zoom when changing pages
  useEffect(() => {
    handleResetZoom();
  }, [currentIndex, handleResetZoom]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      readerRef.current?.requestFullscreen().catch((err) => {
        console.error(
          `Error attempting to enable full-screen mode: ${err.message}`,
        );
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const shareData = {
      title: `Read ${title} Online`,
      text: `Check out "${title}" - ${pages.length} pages available to read online for free.`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Error sharing:", err);
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShowShareMenu(true);
        setTimeout(() => setShowShareMenu(false), 2000);
      } catch (err) {
        console.error("Error copying to clipboard:", err);
      }
    }
  };

  const handleDownloadCurrentPage = async () => {
    try {
      setDownloadingPage(true);

      // 获取当前页的所有索引（双页模式下可能有两个页面）
      const pageIndices = getCurrentPageIndices();

      for (const pageIndex of pageIndices) {
        const pageUrl = pages[pageIndex];
        const displayUrl = getPageDisplayUrl(pageIndex);
        const urlToDownload = displayUrl || pageUrl;

        const response = await fetch(urlToDownload);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `page-${pageIndex + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Failed to download page:", err);
    } finally {
      setDownloadingPage(false);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || pages.length === 0) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newIndex = Math.min(
      pages.length - 1,
      Math.max(0, Math.floor(percentage * pages.length)),
    );
    setCurrentIndex(newIndex);
  };

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleProgressClick(e);
  };

  const handleProgressTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleProgressTouchMove(e);
  };

  const handleProgressTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || pages.length === 0) return;

    const touch = e.touches[0];
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = touch.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newIndex = Math.min(
      pages.length - 1,
      Math.max(0, Math.floor(percentage * pages.length)),
    );
    setCurrentIndex(newIndex);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !progressBarRef.current || pages.length === 0) return;

      const rect = progressBarRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, clickX / rect.width));
      const newIndex = Math.min(
        pages.length - 1,
        Math.max(0, Math.floor(percentage * pages.length)),
      );
      setCurrentIndex(newIndex);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, pages.length]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[var(--color-text)] flex flex-col items-center justify-center text-white z-[100]">
        <div className="relative">
          <Loader2 className="w-16 h-16 text-[var(--color-primary)] animate-spin" />
          <div className="absolute inset-0 w-16 h-16 border-2 border-[var(--color-primary)]/20 rounded-full animate-ping" />
        </div>
        <p className="text-sm font-bold uppercase tracking-widest mt-6 animate-pulse">
          Loading Reader...
        </p>
      </div>
    );
  }

  // Preload next 3 pages
  const preloadIndices = Array.from(
    { length: 3 },
    (_, i) => currentIndex + 1 + i,
  ).filter((index) => index < pages.length);

  return (
    <div
      ref={readerRef}
      className={`fixed inset-0 bg-[#0A0A0A] flex flex-col z-[100] transition-all duration-500 ${isFullscreen ? "p-0" : ""}`}
    >
      {/* Top Bar */}
      <div className="h-14 sm:h-16 px-4 sm:px-6 flex items-center justify-between glass-dark z-20">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href={backUrl}
            className="p-2 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </Link>
          <div className="hidden sm:block">
            <Link href={`/book/${dbId}`} className="block group">
              <h2 className="text-white font-display font-bold text-xs sm:text-sm truncate max-w-[200px] sm:max-w-[300px] group-hover:text-[var(--color-primary)] transition-colors">
                {title}
              </h2>
            </Link>
            <p className="text-[10px] sm:text-[11px] text-white/50 font-mono">
              {isRestoringProgress ? (
                <span className="text-[var(--color-primary)]">
                  恢复阅读进度...
                </span>
              ) : isDualPageMode && currentIndex > 0 ? (
                `Pages ${getCurrentPageIndices().join("-")} of ${pages.length}`
              ) : (
                `Page ${currentIndex + 1} of ${pages.length}`
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center gap-1 bg-white/5 rounded-lg sm:rounded-xl p-1">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 25 || (isDualPageMode && currentIndex > 0)}
              className="p-1.5 sm:p-2 flex items-center justify-center hover:bg-white/10 rounded-md transition-colors text-white disabled:opacity-30 disabled:cursor-not-allowed"
              title={
                isDualPageMode && currentIndex > 0
                  ? "双页模式下不支持缩放，请切换到单页模式"
                  : "Zoom Out (-)"
              }
            >
              <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              disabled={isDualPageMode && currentIndex > 0}
              className="px-2 sm:px-3 py-1.5 sm:py-1 text-[10px] sm:text-xs font-mono text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors min-w-[48px] sm:min-w-[56px] disabled:opacity-30 disabled:cursor-not-allowed"
              title={
                isDualPageMode && currentIndex > 0
                  ? "双页模式下不支持缩放，请切换到单页模式"
                  : "Reset Zoom (Ctrl+0)"
              }
            >
              {zoom}%
            </button>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 300 || (isDualPageMode && currentIndex > 0)}
              className="p-1.5 sm:p-2 flex items-center justify-center hover:bg-white/10 rounded-md transition-colors text-white disabled:opacity-30 disabled:cursor-not-allowed"
              title={
                isDualPageMode && currentIndex > 0
                  ? "双页模式下不支持缩放，请切换到单页模式"
                  : "Zoom In (+)"
              }
            >
              <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
          {/* 双页/单页切换按钮 - 仅宽屏显示 */}
          <button
            onClick={() => {
              setIsDualPageMode(!isDualPageMode);
              // 切换到双页模式时重置缩放
              if (!isDualPageMode) {
                setZoom(100);
                setIsZoomed(false);
                setPanPosition({ x: 0, y: 0 });
              }
            }}
            className={`hidden md:block p-2 sm:p-3 flex items-center justify-center rounded-lg sm:rounded-xl transition-colors text-white ${
              isDualPageMode
                ? "bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)]"
                : "bg-white/5 hover:bg-white/10"
            }`}
            title={isDualPageMode ? "切换到单页模式" : "切换到双页模式"}
          >
            {isDualPageMode ? (
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={`p-2 sm:p-3 flex items-center justify-center rounded-lg sm:rounded-xl transition-colors text-white ${
              showThumbnails
                ? "bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)]"
                : "bg-white/5 hover:bg-white/10"
            }`}
            title="Toggle Thumbnails"
          >
            <Grid3X3 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          {/* <button
            onClick={handlePrint}
            className="p-2 sm:p-3 bg-white/5 hover:bg-white/10 rounded-lg sm:rounded-xl transition-colors text-white"
            title="Print"
          >
            <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
          </button> */}
          <button
            onClick={toggleFullscreen}
            className="p-2 sm:p-3 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg sm:rounded-xl transition-colors text-white"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
          <button
            onClick={handleDownloadCurrentPage}
            disabled={downloadingPage}
            className="p-2 sm:p-3 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg sm:rounded-xl transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              isDualPageMode && currentIndex > 0
                ? "下载当前两页图片"
                : "下载当前页图片"
            }
          >
            {downloadingPage ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            ) : (
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
          <button
            onClick={handleShare}
            className="p-2 sm:p-3 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg sm:rounded-xl transition-colors text-white relative"
            title="Share this book"
          >
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
            {showShareMenu && (
              <div className="absolute top-full right-0 mt-2 px-3 py-1.5 bg-[var(--color-primary)] text-white text-xs font-medium rounded-lg shadow-lg whitespace-nowrap animate-in fade-in slide-in-from-top-2">
                Link copied!
              </div>
            )}
          </button>
          <Link
            href={downloadUrl}
            className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white text-[10px] sm:text-xs font-bold rounded-lg sm:rounded-xl uppercase tracking-wider shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Download PDF</span>
            <span className="sm:hidden">PDF</span>
          </Link>
        </div>
      </div>

      {/* Main Reader Stage */}
      <div
        className="flex-1 relative flex items-center justify-center overflow-hidden p-0"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Thumbnail Sidebar */}
        {showThumbnails && (
          <div
            ref={thumbnailPanelRef}
            className="absolute left-0 top-0 bottom-0 w-64 sm:w-72 bg-black/95 backdrop-blur-sm z-30 border-r border-white/10 flex flex-col"
          >
            {/* Thumbnail Header */}
            <div className="h-14 px-4 flex items-center justify-between border-b border-white/10">
              <h3 className="text-white font-bold text-sm">Pages</h3>
              <button
                onClick={() => setShowThumbnails(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thumbnail Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-3">
                {thumbnails.map((thumbUrl, idx) => {
                  const displayUrl = getPageDisplayUrl(idx);
                  const isZip = isZipUrl(pages[idx]);
                  const isLoading = isZip && !displayUrl;

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentIndex(idx);
                      }}
                      className={`relative aspect-[3/4] rounded-lg overflow-hidden transition-all duration-300 group ${
                        idx === currentIndex
                          ? "ring-2 ring-[var(--color-primary)] scale-[1.02]"
                          : "opacity-60 hover:opacity-100 hover:scale-[1.02]"
                      }`}
                    >
                      {isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <Loader2 className="w-6 h-6 text-[var(--color-primary)] animate-spin" />
                        </div>
                      ) : (
                        <Image
                          src={thumbUrl}
                          alt={`Page ${idx + 1}`}
                          fill
                          className="object-cover"
                          referrerPolicy="no-referrer"
                          unoptimized
                        />
                      )}
                      {/* Page Number Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
                        <span className="text-white text-xs font-mono font-bold">
                          {idx + 1}
                        </span>
                      </div>
                      {/* Current Page Indicator */}
                      {idx === currentIndex && (
                        <div className="absolute inset-0 bg-[var(--color-primary)]/10" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="relative h-full w-full max-w-5xl flex items-center justify-center group"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* 双页模式显示 */}
            {isDualPageMode && currentIndex > 0 && pages.length > 1 ? (
              <div className="flex h-full w-full items-center justify-center">
                {getCurrentPageIndices().map((pageIndex, idx) => {
                  const displayUrl = getPageDisplayUrl(pageIndex);
                  const pageUrl = pages[pageIndex];
                  const isZip = isZipUrl(pageUrl);
                  const isLoading = isZip && !displayUrl;

                  return (
                    <div
                      key={pageIndex}
                      ref={idx === 0 ? imageContainerRef : undefined}
                      onWheel={idx === 0 ? handleWheel : undefined}
                      className="relative h-full shadow-2xl bg-white/5 overflow-hidden"
                      style={{
                        width: "50%",
                        transform:
                          zoom !== 100
                            ? `scale(${zoom / 100}) translate(${panPosition.x / (zoom / 100)}px, ${panPosition.y / (zoom / 100)}px)`
                            : "none",
                        cursor: isZoomed
                          ? isPanning
                            ? "grabbing"
                            : "grab"
                          : "default",
                      }}
                      onMouseDown={idx === 0 ? handleImageMouseDown : undefined}
                    >
                      {isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="w-12 h-12 text-[var(--color-primary)] animate-spin" />
                        </div>
                      ) : displayUrl ? (
                        <Image
                          src={displayUrl}
                          alt={`Page ${pageIndex + 1}`}
                          fill
                          className="object-contain"
                          referrerPolicy="no-referrer"
                          unoptimized
                          priority={pageIndex === currentIndex}
                        />
                      ) : null}
                      {/* 中间装订线效果 - 左页右边阴影 */}
                      {idx === 0 && (
                        <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/30 to-transparent pointer-events-none" />
                      )}
                      {/* 中间装订线效果 - 右页左边阴影 */}
                      {idx === 1 && (
                        <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/30 to-transparent pointer-events-none" />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* 单页模式或封面页 */
              <div
                ref={imageContainerRef}
                onWheel={handleWheel}
                className="relative h-full w-full shadow-2xl rounded-sm overflow-hidden"
                style={{
                  transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoom / 100})`,
                  transition: isPanning ? "none" : "transform duration-200",
                  touchAction: "none",
                  cursor: isZoomed
                    ? isPanning
                      ? "grabbing"
                      : "grab"
                    : "default",
                }}
                onMouseDown={handleImageMouseDown}
                onTouchStart={handleTouchStartPan}
                onTouchMove={handleTouchMovePan}
                onTouchEnd={handleTouchEndPan}
              >
                {(() => {
                  const displayUrl = getPageDisplayUrl(currentIndex);
                  const pageUrl = pages[currentIndex];
                  const isZip = isZipUrl(pageUrl);
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
                    <Image
                      src={displayUrl}
                      alt={`Page ${currentIndex + 1}`}
                      fill
                      className="object-contain"
                      referrerPolicy="no-referrer"
                      unoptimized
                      priority
                    />
                  );
                })()}
              </div>
            )}

            {/* Page Overlay Stats (Mobile Only) */}
            <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 glass-dark px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-[11px] text-white/70 font-mono md:hidden">
              {isDualPageMode && currentIndex > 0
                ? `${getCurrentPageIndices().join("-")} / ${pages.length}`
                : `${currentIndex + 1} / ${pages.length}`}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Overlays */}
        <button
          onClick={prevPage}
          disabled={currentIndex === 0}
          className="absolute left-2 sm:left-4 md:left-8 top-1/2 -translate-y-1/2 p-2 sm:p-3 md:p-4 glass hover:bg-white/15 rounded-full text-black/50 hover:text-white disabled:opacity-0 transition-all z-10"
        >
          <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
        </button>
        <button
          onClick={nextPage}
          disabled={currentIndex === pages.length - 1}
          className="absolute right-2 sm:right-4 md:right-8 top-1/2 -translate-y-1/2 p-2 sm:p-3 md:p-4 glass hover:bg-white/15 rounded-full text-black/50 hover:text-white disabled:opacity-0 transition-all z-10"
        >
          <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="h-12 sm:h-14 px-4 sm:px-8 flex items-center gap-4 sm:gap-6 glass-dark z-20">
        <div
          ref={progressBarRef}
          className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden relative cursor-pointer group"
          onClick={handleProgressClick}
          onMouseDown={handleProgressMouseDown}
          onTouchStart={handleProgressTouchStart}
          onTouchMove={handleProgressTouchMove}
        >
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] shadow-[0_0_10px_var(--color-primary)]"
            initial={false}
            animate={{ width: `${((currentIndex + 1) / pages.length) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
          {/* Draggable Handle */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              left: `${((currentIndex + 1) / pages.length) * 100}%`,
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>
        <div className="text-white/70 text-xs font-mono whitespace-nowrap">
          {isDualPageMode && currentIndex > 0
            ? `${getCurrentPageIndices().join("-")} / ${pages.length}`
            : `${currentIndex + 1} / ${pages.length}`}
        </div>
      </div>

      {/* Hidden Preloading Div */}
      <div className="fixed opacity-0 pointer-events-none -z-50 overflow-hidden">
        {preloadIndices.map((idx) => (
          <img
            key={idx}
            src={pages[idx]}
            referrerPolicy="no-referrer"
            alt="preload"
          />
        ))}
      </div>
    </div>
  );
}
