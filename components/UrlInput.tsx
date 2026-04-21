"use client";

import React from "react";
import { BookOpen, ArrowRight } from "lucide-react";

interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export default function UrlInput({ value, onChange, onSubmit }: UrlInputProps) {
  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 md:p-6 shadow-lg border border-[var(--color-border-light)] mb-6 sm:mb-8">
      <div className="relative group">
        <div className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <input
          type="text"
          placeholder="Paste FlipHTML5 book URL here..."
          className="w-full pl-11 sm:pl-14 pr-14 sm:pr-16 py-4 sm:py-5 md:py-6 bg-[var(--color-bg)] border-2 border-[var(--color-border-light)] rounded-xl sm:rounded-2xl focus:bg-white focus:border-[var(--color-primary)]/40 focus:ring-4 focus:ring-[var(--color-primary)]/10 transition-all outline-none text-sm sm:text-base md:text-lg font-body"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        />
        <button
          onClick={onSubmit}
          disabled={!value}
          className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 aspect-square bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white rounded-lg sm:rounded-xl flex items-center justify-center hover:shadow-lg hover:scale-105 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale disabled:hover:scale-100"
        >
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
      <p className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-[var(--color-text-muted)] text-center px-2">
        Example:{" "}
        <button
          type="button"
          onClick={() => onChange("https://fliphtml5.com/REZIDE/The-Glasshouse_merged/The_Glasshouse/")}
          className="text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] hover:underline transition-colors cursor-pointer"
        >
          https://fliphtml5.com/REZIDE/The-Glasshouse_merged/The_Glasshouse/
        </button>
      </p>
    </div>
  );
}
