"use client";

import React from "react";
import { motion } from "motion/react";

interface ProgressBarProps {
  progress: number;
  status: "idle" | "loading" | "processing" | "done" | "error";
}

export default function ProgressBar({ progress, status }: ProgressBarProps) {
  return (
    <div className="w-full h-2 bg-[var(--color-bg)] rounded-full overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${status === "error" ? "bg-red-500" : "bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)]"}`}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  );
}
