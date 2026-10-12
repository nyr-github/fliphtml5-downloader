"use client";

import React, { useState, useEffect, useCallback } from "react";
import { jsPDF } from "jspdf";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getBlob, extractPdfPages, isZipUrl } from "@/lib/pdf-handler";
import { extractIdsFromUrl, loadBookConfig } from "@/hooks/useBookConfig";
import UrlInput from "./UrlInput";
import TaskList from "./TaskList";
import PayModal, {
  getPendingOrder,
  clearPendingOrder,
  checkOrderStatus,
  finalizePaidOrder,
  isDailyFreeEnabled,
  type PendingOrder,
} from "./PayModal";
import { getAndClearPendingDownloadUrl } from "@/lib/download-storage";
import {
  paymentDB,
  consumeOrCheckFreeToday,
  hasActiveWeeklyPass,
  getWeeklyPassExpiresAt,
} from "@/lib/payment-db";

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

// 任务持久化：只存可序列化的字段（jsPDF 实例与 blob URL 刷新后必然失效）。
type SavedTask = Omit<DownloadTask, "pdfData" | "pdfBlobUrl" | "imageUrls">;
const TASKS_STORAGE_KEY = "fbl_tasks";
const MAX_SAVED_TASKS = 10;

function loadSavedTasks(): DownloadTask[] {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as SavedTask[];
    return list.slice(0, MAX_SAVED_TASKS).map((t) => ({
      ...t,
      // 刷新会中断转换：错误保留现场，其余（含已完成）统一恢复为可重新开始的 idle
      status: t.status === "error" ? "error" : "idle",
      progress: t.status === "error" ? t.progress : 0,
      currentPage: 0,
      totalPages: t.status === "error" ? t.totalPages : 0,
    }));
  } catch {
    return [];
  }
}

// 周卡剩余时长的紧凑展示：6d 12h 5m 30s / 12h 5m 30s / 5m 30s / 30s
function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (d > 0) return `${d}d ${h}h ${m}m ${s}s`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
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
  // Read pending URL from localStorage IMMEDIATELY (before first render)
  // This ensures we catch it even on client-side navigation
  const pendingUrlFromStorage =
    typeof window !== "undefined" ? getAndClearPendingDownloadUrl() : null;

  const [mounted, setMounted] = useState(false);
  const [urlInput, setUrlInput] = useState(pendingUrlFromStorage || "");
  const [tasks, setTasks] = useState<DownloadTask[]>(() =>
    typeof window !== "undefined" ? loadSavedTasks() : [],
  );
  // 周卡生效中则持有到期时间 ISO 字符串，用于页面提示
  const [weekPassUntil, setWeekPassUntil] = useState<string | null>(() =>
    typeof window !== "undefined" ? getWeeklyPassExpiresAt() : null,
  );
  const [nowTick, setNowTick] = useState<number>(() => Date.now());
  const refreshWeekPass = useCallback(() => {
    setNowTick(Date.now());
    setWeekPassUntil(getWeeklyPassExpiresAt());
  }, []);

  // 周卡生效期间每秒对时：倒计时实时跳动，到期后 weekPassUntil 自动置空隐藏提示条
  useEffect(() => {
    if (!weekPassUntil) return;
    const timer = setInterval(() => {
      setNowTick(Date.now());
      setWeekPassUntil(getWeeklyPassExpiresAt());
    }, 1000);
    return () => clearInterval(timer);
  }, [weekPassUntil]);
  const [payTarget, setPayTarget] = useState<{
    bookKey: string;
    url: string;
    taskId: string;
    resumeOrder: PendingOrder | null;
  } | null>(null);
  const searchParams = useSearchParams();
  const initialUrlProcessed = React.useRef(false);
  const pendingUrlRef = React.useRef<string | null>(pendingUrlFromStorage);
  const payTargetRef = React.useRef<typeof payTarget>(null);

  useEffect(() => {
    payTargetRef.current = payTarget;
  }, [payTarget]);

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

  // 任务变化时快照最近 MAX_SAVED_TASKS 条（tasks 新任务在前），刷新后恢复。
  useEffect(() => {
    if (!mounted) return;
    try {
      const slim: SavedTask[] = tasks
        .slice(0, MAX_SAVED_TASKS)
        .map((t) => ({
          id: t.id,
          url: t.url,
          status: t.status,
          progress: t.progress,
          currentPage: t.currentPage,
          totalPages: t.totalPages,
          title: t.title,
          errorMessage: t.errorMessage,
          id1: t.id1,
          id2: t.id2,
          canReadOnline: t.canReadOnline,
        }));
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(slim));
    } catch {
      // 存储满或隐私模式下写入失败，不影响页面功能
    }
  }, [tasks, mounted]);

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

      // 付费墙：周卡有效 → 直接放行；否则看单书授权与每日免费额度。
      // 服务端 FREE_ONCE_EVERYDAY=false 时取消每日免费额度，未解锁文件一律弹窗。
      // 服务端 PAYMENT_ENABLE=false 时弹窗只保留免费券兑换（暂时只能走 Discord / X 领码）。
      if (!hasActiveWeeklyPass()) {
        const bookKey = `${ids.id1}_${ids.id2}`;
        const licensed = await paymentDB.hasLicense(bookKey);
        const freeOk =
          (await isDailyFreeEnabled()) && consumeOrCheckFreeToday(bookKey);
        if (!licensed && !freeOk) {
          updateTask(taskId, { status: "idle" });
          setPayTarget({ bookKey, url, taskId, resumeOrder: null });
          return;
        }
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
            // 继续处理Next
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

  // 支付成功（许可已写入 IndexedDB）后，重新进入 startDownload：
  // 此时 hasLicense 为 true，付费墙直接放行并继续处理。
  const handlePaySuccess = useCallback(
    (_bookKey: string, url: string) => {
      const target = payTargetRef.current;
      clearPendingOrder();
      setPayTarget(null);
      refreshWeekPass();
      if (target) {
        startDownload(url, target.taskId);
      }
    },
    [startDownload, refreshWeekPass],
  );

  // callback 回跳/刷新后，若存在未确认的待支付订单：先核验一次，
  // 已支付则写入授权并立即开始下载；仍未确认才回到弹窗轮询兜底。
  const resumeCheckedRef = React.useRef(false);
  useEffect(() => {
    if (!mounted || resumeCheckedRef.current) return;
    const pending = getPendingOrder();
    if (!pending) return;
    resumeCheckedRef.current = true;
    (async () => {
      const licensed = await paymentDB.hasLicense(pending.bookKey);
      if (licensed) {
        clearPendingOrder();
        return;
      }
      const ids = extractIds(pending.url);
      if (!ids) {
        clearPendingOrder();
        return;
      }
      const status = await checkOrderStatus(pending);
      if (status === "paid") {
        await finalizePaidOrder(pending);
        refreshWeekPass();
        // 复用同 URL 的已恢复任务（若有），立即进入下载流程
        const restored = loadSavedTasks().find((t) => t.url === pending.url);
        startDownload(pending.url, restored?.id);
        return;
      }
      if (status === "failed") {
        clearPendingOrder();
        toast.error("Payment failed", { description: "Please try again." });
        return;
      }
      // 未确认：复用或新建任务，恢复等待弹窗并继续轮询
      const existing = loadSavedTasks().find((t) => t.url === pending.url);
      const taskId = existing ? existing.id : `${Date.now()}`;
      if (!existing) {
        setTasks((prev) => [
          {
            id: taskId,
            url: pending.url,
            status: "idle",
            progress: 0,
            currentPage: 0,
            totalPages: 0,
            title: ids.id2,
            id1: ids.id1,
            id2: ids.id2,
          },
          ...prev,
        ]);
      }
      setPayTarget({
        bookKey: pending.bookKey,
        url: pending.url,
        taskId,
        resumeOrder: pending,
      });
    })();
  }, [mounted, extractIds, startDownload, refreshWeekPass]);

  useEffect(() => {
    // Priority 1: localStorage pending URL (already read during component init)
    const pendingUrl = pendingUrlRef.current;

    // Priority 2: URL searchParams (for backward compatibility)
    const urlParam = searchParams.get("url") || initialUrl;

    // Use pending URL from localStorage if available, otherwise use URL param
    const finalUrl = pendingUrl || urlParam;

    if (finalUrl && mounted && !initialUrlProcessed.current) {
      initialUrlProcessed.current = true;
      setUrlInput(finalUrl);

      // 刷新会重跑本逻辑（URL 参数仍在）：若同 URL 任务已被恢复则复用，避免重复建卡。
      const existingTask = loadSavedTasks().find((t) => t.url === finalUrl);

      if (autoStart) {
        setTimeout(() => startDownload(finalUrl, existingTask?.id), 0);
      } else {
        // Create idle task
        const ids = extractIds(finalUrl);
        if (ids && !existingTask) {
          const taskId = `${Date.now()}`;
          const idleTask: DownloadTask = {
            id: taskId,
            url: finalUrl,
            status: "idle",
            progress: 0,
            currentPage: 0,
            totalPages: 0,
            title: ids.id2,
            id1: ids.id1,
            id2: ids.id2,
          };
          setTimeout(
            () => setTasks((prev) => [idleTask, ...prev]),
            0,
          );
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
      {/* Weekly pass status */}
      {weekPassUntil && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-primary-dark)]/10 border border-[var(--color-primary)]/20 px-4 py-2.5 text-xs sm:text-sm font-semibold text-[var(--color-primary-dark)]"
        >
          <Sparkles className="w-4 h-4 flex-shrink-0" />
          <span>
            Weekly pass active — unlimited downloads until{" "}
            {new Date(weekPassUntil).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {" · "}
            {formatRemaining(
              new Date(weekPassUntil).getTime() - nowTick,
            )}{" "}
            left
          </span>
        </motion.div>
      )}

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

      <PayModal
        key={payTarget ? payTarget.taskId : "pay-none"}
        open={!!payTarget}
        bookKey={payTarget?.bookKey ?? ""}
        url={payTarget?.url ?? ""}
        resumeOrder={payTarget?.resumeOrder ?? null}
        onSuccess={handlePaySuccess}
        onClose={() => {
          clearPendingOrder();
          setPayTarget(null);
        }}
      />
    </div>
  );
}
