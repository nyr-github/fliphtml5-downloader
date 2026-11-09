"use client";

import { AlertCircle, Download, Loader2, RefreshCw, X } from "lucide-react";
import { motion } from "motion/react";
import { pdfFilename, type DownloadTask } from "@/lib/tasks";
import ProgressBar from "./ProgressBar";

interface TaskCardProps {
  task: DownloadTask;
  onRemove: (id: string) => void;
  onCancel: (id: string) => void;
  onStartDownload: (url: string, id: string) => void;
}

export default function TaskCard({ task, onRemove, onCancel, onStartDownload }: TaskCardProps) {
  const active = task.status === "loading" || task.status === "processing";
  const buttonClass = "flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold bg-[var(--color-primary)] text-white";
  return (
    <motion.article layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="relative rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <button type="button" aria-label={`Remove ${task.title}`} onClick={() => onRemove(task.id)}
        className="absolute right-3 top-3 rounded-lg p-2 hover:bg-[var(--color-bg)]"><X size={18} /></button>
      <div className="pr-8">
        <h3 className="truncate font-display text-lg font-bold" title={task.title}>{task.title}</h3>
        <p className="mt-1 truncate text-xs text-[var(--color-text-secondary)]" title={task.url}>{task.url}</p>
      </div>
      <div role="status" className="my-3 flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
        {active && <Loader2 className="animate-spin" size={16} />}
        {task.status === "loading" ? "Loading configuration..." : task.status === "processing"
          ? `Processing ${task.currentPage}/${task.totalPages}` : task.status === "done"
          ? "Complete - PDF ready" : task.status === "error" ? "Conversion failed" : "Ready to convert"}
      </div>
      <ProgressBar progress={task.progress} status={task.status} />
      {task.errorMessage && task.status === "error" && (
        <p role="alert" className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-1 shrink-0" size={16} />{task.errorMessage}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        {active ? (
          <button type="button" className={buttonClass} onClick={() => onCancel(task.id)}>Cancel</button>
        ) : task.status === "done" && task.pdfBlobUrl ? (
          <a className={buttonClass} href={task.pdfBlobUrl} download={pdfFilename(task.title)}>
            <Download size={16} />Download PDF
          </a>
        ) : (
          <button type="button" className={buttonClass} onClick={() => onStartDownload(task.url, task.id)}>
            <RefreshCw size={16} />{task.status === "error" ? "Retry conversion" : "Start conversion"}
          </button>
        )}
        <a className="rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold"
          href={task.url} target="_blank" rel="noopener noreferrer">Open source publication</a>
      </div>
    </motion.article>
  );
}
