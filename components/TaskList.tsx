"use client";

import React from "react";
import { jsPDF } from "jspdf";
import { AnimatePresence } from "motion/react";
import TaskCard from "./TaskCard";

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

interface TaskListProps {
  tasks: DownloadTask[];
  onRemove: (id: string) => void;
  onStartDownload: (url: string, taskId: string) => void;
  extractIds: (url: string) => { id1: string; id2: string } | null;
}

export default function TaskList({
  tasks,
  onRemove,
  onStartDownload,
  extractIds,
}: TaskListProps) {
  return (
    <div className="space-y-4">
      <AnimatePresence initial={false}>
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onRemove={onRemove}
            onStartDownload={onStartDownload}
            extractIds={extractIds}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
