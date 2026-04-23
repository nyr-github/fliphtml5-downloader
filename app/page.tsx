import React from "react";
import { Sparkles, MessageCircle } from "lucide-react";
import FlipDownloaderClient from "@/components/FlipDownloaderClient";
import BookListClient from "@/components/BookListClient";
import { getBooksPaginated } from "@/lib/actions";
import { Suspense } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FlipHTML5 Downloader - Download Flipbook as PDF Instantly",
  description:
    "Convert and download FlipHTML5 flipbooks as high-quality PDF files. Free online flipbook converter with instant PDF extraction. Browse popular flipbooks and download in seconds.",
  keywords: [
    "fliphtml5 downloader",
    "flipbook to pdf",
    "download fliphtml5",
    "flipbook converter",
    "free pdf converter",
    "online flipbook download",
  ],
  openGraph: {
    title: "FlipHTML5 Downloader - Download Flipbook as PDF Instantly",
    description:
      "Convert and download FlipHTML5 flipbooks as high-quality PDF files. Free online flipbook converter.",
    type: "website",
  },
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

  // 结构化数据 (JSON-LD)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "FlipHTML5 Downloader",
    description:
      "Download FlipHTML5 flipbooks as high-quality PDF files instantly. Free online flipbook converter and reader.",
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://yourdomain.com",
    applicationCategory: "UtilityApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "1250",
    },
  };

  return (
    <>
      {/* JSON-LD 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
        </div>
      </div>
    </>
  );
}
