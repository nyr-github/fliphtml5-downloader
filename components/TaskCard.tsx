"use client";

import React from "react";
import { jsPDF } from "jspdf";
import {
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileText,
  Eye,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import ProgressBar from "./ProgressBar";

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

interface TaskCardProps {
  task: DownloadTask;
  onRemove: (id: string) => void;
  onStartDownload: (url: string, taskId: string) => void;
  extractIds: (url: string) => { id1: string; id2: string } | null;
}

export default function TaskCard({
  task,
  onRemove,
  onStartDownload,
  extractIds,
}: TaskCardProps) {
  const handleDownloadPdf = () => {
    if (task.pdfBlobUrl) {
      const link = document.createElement("a");
      link.href = task.pdfBlobUrl;
      const safe = task.title.replace(/[/\\?%*:|"<>]/g, "_") || "book";
      link.download = `${safe}.pdf`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
    } else if (task.pdfData) {
      const safe = task.title.replace(/[/\\?%*:|"<>]/g, "_") || "book";
      task.pdfData.save(`${safe}.pdf`);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20, height: 0 }}
      animate={{ opacity: 1, x: 0, height: "auto" }}
      exit={{ opacity: 0, scale: 0.95, height: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-[var(--color-border-light)] shadow-sm relative overflow-hidden group hover-lift"
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
        {/* Left: Task Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 sm:gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-sm sm:text-base md:text-lg truncate pr-4 text-[var(--color-text)]">
                {task.title}
              </h3>
              <div className="flex items-center gap-2 mt-1.5">
                {task.status === "loading" || task.status === "processing" ? (
                  <div className="flex items-center gap-2 text-[9px] sm:text-[11px] uppercase tracking-wider font-bold text-[var(--color-primary)]">
                    <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
                    <span>
                      Processing {task.currentPage}/{task.totalPages}
                    </span>
                  </div>
                ) : task.status === "idle" ? (
                  <div className="flex items-center gap-2 text-[9px] sm:text-[11px] uppercase tracking-wider font-semibold text-[var(--color-text-muted)]">
                    <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>Ready to Process</span>
                  </div>
                ) : task.status === "done" ? (
                  <div className="flex items-center gap-2 text-[9px] sm:text-[11px] uppercase tracking-wider font-bold text-green-600">
                    <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>Complete</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-[9px] sm:text-[11px] uppercase tracking-wider font-bold text-red-500">
                    <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>Error</span>
                  </div>
                )}
              </div>
            </div>
            {/* <button
              onClick={() => onRemove(task.id)}
              className="p-2 hover:bg-[var(--color-bg)] rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button> */}
          </div>

          <ProgressBar progress={task.progress} status={task.status} />
        </div>

        {/* Right: Action Buttons (Desktop) */}
        {task.status === "idle" && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 lg:flex-shrink-0 lg:w-auto">
            <button
              onClick={() => onStartDownload(task.url, task.id)}
              className="flex-1 lg:flex-initial min-w-[150px] sm:min-w-[160px] px-4 sm:px-6 py-3 sm:py-3.5 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 sm:gap-3 hover:shadow-lg active:scale-95 transition-all"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              Start PDF Conversion
            </button>
            <Link
              href={`/read/${extractIds(task.url)?.id1}_${extractIds(task.url)?.id2}`}
              target="_blank"
              className="flex-1 lg:flex-initial min-w-[150px] sm:min-w-[140px] px-4 sm:px-6 py-3 sm:py-3.5 bg-white border-2 border-[var(--color-border)] text-[var(--color-secondary)] text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 sm:gap-3 hover:border-[var(--color-secondary)] hover:shadow-md active:scale-95 transition-all"
            >
              <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
              Read Online
            </Link>
          </div>
        )}

        {(task.status === "processing" || task.status === "loading") &&
          task.canReadOnline && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 lg:flex-shrink-0 lg:w-auto">
              <Link
                href={`/read/${task.id1}_${task.id2}`}
                target="_blank"
                className="flex-1 lg:flex-initial min-w-[150px] sm:min-w-[140px] px-4 sm:px-6 py-3 sm:py-3.5 bg-white border-2 border-[var(--color-border)] text-[var(--color-secondary)] text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 sm:gap-3 hover:border-[var(--color-secondary)] hover:shadow-md active:scale-95 transition-all"
              >
                <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                Read Online
              </Link>
            </div>
          )}

        {task.status === "done" && (
          <div className="flex  items-stretch sm:items-center gap-2 sm:gap-3 lg:flex-shrink-0 lg:w-auto">
            <button
              onClick={handleDownloadPdf}
              className="flex-1 lg:flex-initial min-w-[120px] sm:min-w-[130px] px-4 sm:px-6 py-3 sm:py-3.5 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 hover:shadow-lg active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            <Link
              href={`/read/${task.id1}_${task.id2}`}
              target="_blank"
              className="flex-1 lg:flex-initial min-w-[120px] sm:min-w-[120px] px-4 sm:px-6 py-3 sm:py-3.5 bg-white border-2 border-[var(--color-border)] text-[var(--color-secondary)] text-xs font-bold rounded-xl flex items-center justify-center gap-2 hover:border-[var(--color-secondary)] hover:shadow-md active:scale-95 transition-all"
            >
              <Eye className="w-4 h-4" />
              Read Online
            </Link>
          </div>
        )}
      </div>

      {/* Error Message (Full Width) */}
      {task.status === "error" && (
        <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-red-50 border border-red-100 rounded-lg sm:rounded-xl">
          <p className="text-[11px] sm:text-xs text-red-600 font-medium leading-relaxed flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
            {task.errorMessage}
          </p>
        </div>
      )}
    </motion.div>
  );
}
