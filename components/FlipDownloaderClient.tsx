"use client";

import React, { useState, useEffect, useCallback } from "react";
import { jsPDF } from "jspdf";
import { motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getBlob, extractPdfPages, isZipUrl } from "@/lib/pdf-handler";
import { extractIdsFromUrl, loadBookConfig } from "@/hooks/useBookConfig";
import UrlInput from "./UrlInput";
import TaskList from "./TaskList";

interface DownloadTask {
  id: string;
  url: string;
  status: "idle" | "loading" | "processing" | "done" | "error";
  progress: number;
  currentPage: number;
  totalPages: number;
  title: string;
  errorMessage?: string;
  pdfData?: jsPDF;
  imageUrls?: string[];
  pdfBlobUrl?: string;
  id1?: string;
  id2?: string;
  canReadOnline?: boolean;
}

// Helper for concurrency
async function asyncPool<T, R>(
  poolLimit: number,
  array: T[],
  iteratorFn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const ret: Promise<R>[] = [];
  const executing: Promise<any>[] = [];
  for (const [index, item] of array.entries()) {
    const p = iteratorFn(item, index);
    ret.push(p);
    if (poolLimit <= array.length) {
      const e: Promise<any> = p.then(() =>
        executing.splice(executing.indexOf(e), 1),
      );
      executing.push(e);
      if (executing.length >= poolLimit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(ret);
}

export default function FlipDownloaderClient({
  initialUrl,
  autoStart = true,
}: {
  initialUrl?: string;
  autoStart?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [tasks, setTasks] = useState<DownloadTask[]>([]);
  const searchParams = useSearchParams();
  const initialUrlProcessed = React.useRef(false);

  const updateTask = useCallback(
    (id: string, updates: Partial<DownloadTask>) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      );
    },
    [],
  );

  const removeTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const extractIds = extractIdsFromUrl;

  const fetchImageWithMeta = useCallback(
    (imgUrl: string): Promise<{ data: string; w: number; h: number }> => {
      return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Canvas context failed"));
          ctx.drawImage(img, 0, 0);
          try {
            resolve({
              data: canvas.toDataURL("image/jpeg", 0.95),
              w: img.width,
              h: img.height,
            });
          } catch (e) {
            reject(new Error("CORS fail"));
          }
        };
        img.onerror = () => reject(new Error(`Failed to load: ${imgUrl}`));
        img.src = imgUrl;
      });
    },
    [],
  );

  const recordDownloadSuccess = useCallback(
    async (
      id1: string,
      id2: string,
      title: string,
      thumbnail: string,
      pageCount: number,
      description?: string,
    ) => {
      try {
        await fetch("/api/books/record", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id1,
            id2,
            title,
            thumbnail,
            pageCount,
            description,
          }),
        });
      } catch (e) {
        console.error("Failed to record download in database");
      }
    },
    [],
  );

  const startDownload = useCallback(
    async (url: string, existingTaskId?: string) => {
      const ids = extractIds(url);
      if (!ids) {
        toast.error("Invalid URL format", {
          description: "Please enter a valid FlipHTML5 book URL.",
        });
        return;
      }

      const taskId = existingTaskId || `${Date.now()}`;

      if (!existingTaskId) {
        const newTask: DownloadTask = {
          id: taskId,
          url,
          status: "loading",
          progress: 0,
          currentPage: 0,
          totalPages: 0,
          title: ids.id2,
          id1: ids.id1,
          id2: ids.id2,
        };
        setTasks((prev) => [newTask, ...prev]);
        setUrlInput("");
      } else {
        updateTask(taskId, { status: "loading", errorMessage: undefined });
      }

      try {
        // Load config using shared function
        const {
          config,
          pages: pageData,
          imageUrls,
          bookTitle,
          bookDescription,
          firstPageThumb,
          isEncryptionBook,
        } = await loadBookConfig(ids.id1, ids.id2);

        // 检查是否为加密书籍（私有书籍）
        if (isEncryptionBook) {
          updateTask(taskId, {
            status: "error",
            errorMessage:
              "This is a private book and is not available for download.",
          });
          toast.error("Private Book", {
            description:
              "This is a private book and is not available for download.",
          });
          return;
        }

        const metaWidth = config.meta?.pageWidth
          ? Number(config.meta.pageWidth)
          : null;
        const metaHeight = config.meta?.pageHeight
          ? Number(config.meta.pageHeight)
          : null;

        updateTask(taskId, {
          status: "processing",
          totalPages: pageData.length,
          title: bookTitle,
        });

        // Record success in DB as soon as config is parsed
        await recordDownloadSuccess(
          ids.id1,
          ids.id2,
          bookTitle,
          firstPageThumb || "",
          pageData.length,
          bookDescription,
        );

        // 记录成功后，启用在线阅读按钮
        updateTask(taskId, { canReadOnline: true });

        let validResults: Array<{ data: string; w: number; h: number }> = [];
        let completed = 0;

        // 遍历每一页，根据 URL 类型分别处理
        for (let i = 0; i < imageUrls.length; i++) {
          const pageUrl = imageUrls[i];

          try {
            if (isZipUrl(pageUrl)) {
              // 处理 ZIP 文件
              const { url: pdfUrl, password } = await getBlob(pageUrl);

              const pdfPages = await extractPdfPages(
                pdfUrl,
                password,
                (currentPage, totalPages) => {
                  // ZIP 文件内部进度（如果 PDF 有多页）
                  const pageProgress =
                    ((completed + currentPage / totalPages) /
                      imageUrls.length) *
                    100;
                  updateTask(taskId, {
                    progress: pageProgress,
                    currentPage: completed + currentPage,
                  });
                },
              );

              // 将提取的页面添加到结果中
              validResults.push(...pdfPages);
            } else {
              // 处理普通图片
              const result = await fetchImageWithMeta(pageUrl);
              validResults.push(result);
            }

            completed++;
            updateTask(taskId, {
              progress: (completed / imageUrls.length) * 100,
              currentPage: completed,
            });
          } catch (err) {
            console.error(`Failed to process page ${i + 1}:`, err);
            // 继续处理下一页
          }
        }

        if (validResults.length === 0)
          throw new Error("No pages could be downloaded.");

        const first = validResults[0];
        const initialWidth = metaWidth || first.w;
        const initialHeight = metaHeight || first.h;

        const pdf = new jsPDF({
          orientation: initialWidth > initialHeight ? "l" : "p",
          unit: "px",
          format: [initialWidth, initialHeight],
        });

        for (let i = 0; i < validResults.length; i++) {
          const page = validResults[i];
          const pWidth = metaWidth || page.w;
          const pHeight = metaHeight || page.h;
          if (i > 0)
            pdf.addPage([pWidth, pHeight], pWidth > pHeight ? "l" : "p");
          pdf.addImage(page.data, "JPEG", 0, 0, pWidth, pHeight);
        }

        // Create a blob for manual download support
        const pdfBlob = pdf.output("blob");
        const blobUrl = URL.createObjectURL(pdfBlob);

        updateTask(taskId, {
          status: "done",
          progress: 100,
          pdfData: pdf,
          pdfBlobUrl: blobUrl,
          imageUrls: imageUrls,
        });

        // Auto save on first completion
        const safeTitle = bookTitle.replace(/[/\\?%*:|"<>]/g, "_") || "book";
        const finalFileName = `${safeTitle}.pdf`;

        const autoLink = document.createElement("a");
        autoLink.href = blobUrl;
        autoLink.download = finalFileName;
        autoLink.style.display = "none";
        document.body.appendChild(autoLink);
        autoLink.click();
        setTimeout(() => {
          document.body.removeChild(autoLink);
        }, 100);
      } catch (err: any) {
        updateTask(taskId, { status: "error", errorMessage: err.message });
      }
    },
    [
      extractIds,
      fetchImageWithMeta,
      recordDownloadSuccess,
      updateTask,
      getBlob,
      extractPdfPages,
      isZipUrl,
    ],
  );

  useEffect(() => {
    const urlParam = searchParams.get("url") || initialUrl;
    if (urlParam && mounted && !initialUrlProcessed.current) {
      initialUrlProcessed.current = true;
      setUrlInput(urlParam);

      if (autoStart) {
        setTimeout(() => startDownload(urlParam), 0);
      } else {
        // Create idle task
        const ids = extractIds(urlParam);
        if (ids) {
          const taskId = `${Date.now()}`;
          const idleTask: DownloadTask = {
            id: taskId,
            url: urlParam,
            status: "idle",
            progress: 0,
            currentPage: 0,
            totalPages: 0,
            title: ids.id2,
            id1: ids.id1,
            id2: ids.id2,
          };
          setTimeout(() => setTasks([idleTask]), 0);
        }
      }
    }
  }, [mounted, searchParams, startDownload, initialUrl, autoStart, extractIds]);

  if (!mounted) {
    return (
      <div className="p-4 md:p-6 bg-white/50 rounded-3xl min-h-[120px] animate-pulse border border-[var(--color-border-light)]" />
    );
  }

  return (
    <div className="space-y-8">
      {/* Input Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <UrlInput
          value={urlInput}
          onChange={setUrlInput}
          onSubmit={() => startDownload(urlInput)}
        />
      </motion.div>

      {/* Dynamic Task List */}
      {tasks.length > 0 && (
        <div className="text-xs sm:text-sm text-[var(--color-text-muted)] mb-4 flex items-center gap-2">
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            You can add new tasks without waiting for current downloads to
            complete.
          </span>
        </div>
      )}
      <TaskList
        tasks={tasks}
        onRemove={removeTask}
        onStartDownload={startDownload}
        extractIds={extractIds}
      />
    </div>
  );
}
