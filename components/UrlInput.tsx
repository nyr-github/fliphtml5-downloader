"use client";

import { ArrowRight, BookOpen } from "lucide-react";

interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export default function UrlInput({ value, onChange, onSubmit }: UrlInputProps) {
  return (
    <form onSubmit={(event) => { event.preventDefault(); onSubmit(); }}
      className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-lg sm:p-6">
      <label htmlFor="publication-url" className="mb-2 block text-sm font-semibold">Publication URL</label>
      <div className="relative">
        <BookOpen className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" size={20} />
        <input id="publication-url" type="url" required autoComplete="off" spellCheck={false}
          placeholder="https://fliphtml5.com/author/publication/"
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-4 pl-12 pr-16 text-base outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
          value={value} onChange={(event) => onChange(event.target.value)} />
        <button type="submit" disabled={!value.trim()} aria-label="Convert to PDF"
          className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white disabled:opacity-30">
          <ArrowRight size={20} />
        </button>
      </div>
    </form>
  );
}
