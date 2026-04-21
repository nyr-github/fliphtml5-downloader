"use client";

import React from "react";
import Link from "next/link";
import { Download, Eye } from "lucide-react";

interface BookActionsProps {
  id: string;
  id1: string;
  id2: string;
}

export default function BookActions({ id, id1, id2 }: BookActionsProps) {
  const bookUrl = `https://fliphtml5.com/${id1}/${id2}`;
  const downloadUrl = `/?url=${encodeURIComponent(bookUrl)}`;

  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-8 sm:mb-10">
      <Link
        href={`/read/${id}`}
        className="group px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white font-bold rounded-xl flex items-center justify-center gap-2 sm:gap-3 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all active:scale-95 text-sm sm:text-base"
      >
        <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
        <span>Read Online Now</span>
      </Link>
      <Link
        href={downloadUrl}
        className="group px-6 sm:px-8 py-3.5 sm:py-4 bg-white border-2 border-[var(--color-border)] text-[var(--color-text)] font-bold rounded-xl flex items-center justify-center gap-2 sm:gap-3 shadow-md hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:shadow-lg transition-all active:scale-95 text-sm sm:text-base"
      >
        <Download className="w-4 h-4 sm:w-5 sm:h-5" />
        <span>Download as PDF</span>
      </Link>
    </div>
  );
}
