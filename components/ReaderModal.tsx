"use client";

import React from "react";
import { jsPDF } from "jspdf";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

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
}

interface ReaderModalProps {
  task: DownloadTask | null;
  pageIndex: number;
  onClose: () => void;
  onPageChange: (index: number) => void;
}

export default function ReaderModal({
  task,
  pageIndex,
  onClose,
  onPageChange,
}: ReaderModalProps) {
  if (!task) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-3 sm:p-4 backdrop-blur-md"
      >
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-3 sm:gap-4 z-50">
          <span className="text-white/60 text-xs sm:text-sm font-bold uppercase tracking-widest hidden md:inline">
            {pageIndex + 1} / {task.totalPages}
          </span>
          <button
            onClick={onClose}
            className="w-9 h-9 sm:w-10 sm:h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="relative w-full max-w-4xl h-[75vh] sm:h-[80vh] flex items-center justify-center">
          {/* Preloading Layer */}
          <div className="hidden">
            {task.imageUrls
              ?.slice(pageIndex + 1, pageIndex + 6)
              .map((url, i) => (
                <img
                  key={`preload-${i}`}
                  src={url}
                  alt=""
                  referrerPolicy="no-referrer"
                />
              ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={pageIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="relative w-full h-full"
            >
              {task.imageUrls && (
                <div className="relative w-full h-full">
                  <Image
                    src={task.imageUrls[pageIndex]}
                    alt={`Page ${pageIndex + 1}`}
                    fill
                    unoptimized={true}
                    className="object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          <button
            onClick={() => onPageChange(Math.max(0, pageIndex - 1))}
            disabled={pageIndex === 0}
            className="absolute left-0 h-full w-1/4 flex items-center justify-start group disabled:opacity-0"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 ml-2 sm:ml-4 bg-white/10 group-hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all">
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </button>
          <button
            onClick={() =>
              onPageChange(Math.min(task.totalPages - 1, pageIndex + 1))
            }
            disabled={pageIndex === task.totalPages - 1}
            className="absolute right-0 h-full w-1/4 flex items-center justify-end group disabled:opacity-0"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 mr-2 sm:mr-4 bg-white/10 group-hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all">
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </button>
        </div>

        <div className="mt-6 sm:mt-8 flex items-center gap-6 sm:gap-8 md:hidden">
          <span className="text-white/60 text-xs sm:text-sm font-bold uppercase tracking-widest">
            {pageIndex + 1} / {task.totalPages}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
