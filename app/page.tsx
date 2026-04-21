import React from "react";
import { Sparkles } from "lucide-react";
import FlipDownloaderClient from "@/components/FlipDownloaderClient";
import BookListClient from "@/components/BookListClient";
import { getBooksPaginated } from "@/lib/actions";
import { Suspense } from "react";

export const metadata = {
  title: "Fliphtml5 Downloader - Premium PDF Conversion",
  description:
    "Download FlipHTML5 publications as high-quality PDF files instantly. Elegant, fast, and reliable.",
};

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function FlipDownloader({ searchParams }: PageProps) {
  // Get page from URL search params
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const pageSize = 24;

  // Get books for the current page (12 per page)
  const paginatedBooks = await getBooksPaginated(page, pageSize);

  return (
    <div
      className="min-h-screen bg-[var(--color-bg)] font-body overflow-x-hidden"
      suppressHydrationWarning
    >
      {/* Background gradient mesh */}
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden gradient-mesh"
        suppressHydrationWarning
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
        {/* Hero Section */}
        <div className="mb-8 sm:mb-12 md:mb-16 text-center max-w-4xl mx-auto">
          <h1
            className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--color-text)] mb-3 sm:mb-4 leading-[1.1] text-balance"
            suppressHydrationWarning
          >
            Transform Fliphtml5s to
            <span className="block text-gradient mt-1 sm:mt-2">
              Beautiful PDFs
            </span>
          </h1>
          <p
            className="text-sm sm:text-base md:text-lg text-[var(--color-text-secondary)] font-light leading-relaxed max-w-2xl mx-auto px-2"
            suppressHydrationWarning
          >
            Extract high-quality PDFs from FlipHTML5 publications in seconds.
          </p>
        </div>

        {/* Client logic for downloader */}
        <div id="downloader-section" className="mb-10 sm:mb-16">
          <Suspense
            fallback={
              <div className="p-4 sm:p-6 bg-white/50 rounded-2xl sm:rounded-3xl min-h-[100px] sm:min-h-[120px] animate-pulse border border-[var(--color-border-light)]" />
            }
          >
            <FlipDownloaderClient />
          </Suspense>
        </div>

        {/* All Books Section with Pagination */}
        <div id="discovery-square" className="mb-10 sm:mb-16">
          <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 rounded-lg sm:rounded-xl flex items-center justify-center border border-[var(--color-primary)]/20">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-primary)]" />
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text)]">
                Discovery
              </h2>
              <p className="text-[10px] sm:text-xs text-[var(--color-text-muted)] mt-0.5">
                Explore the most popular publications retrieved by our global
                community.
              </p>
            </div>
          </div>

          <Suspense
            fallback={
              <div className="p-4 sm:p-6 bg-white/50 rounded-2xl sm:rounded-3xl min-h-[200px] animate-pulse border border-[var(--color-border-light)]" />
            }
          >
            <BookListClient
              books={paginatedBooks.books}
              currentPage={paginatedBooks.page}
              totalPages={paginatedBooks.totalPages}
            />
          </Suspense>
        </div>

        <footer className="mt-16 sm:mt-24 pt-6 sm:pt-8 border-t border-[var(--color-border-light)] text-center px-4">
          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.25em] font-semibold text-[var(--color-text-muted)]">
            Crafted with Precision • Fast PDF Conversion
          </p>
        </footer>
      </div>
    </div>
  );
}
