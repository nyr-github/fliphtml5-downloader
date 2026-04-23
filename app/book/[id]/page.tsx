import React from "react";
import { getBookById, getRelatedBooks } from "@/lib/actions";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  ChevronLeft,
  Download,
  Layers,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import FlipDownloaderClient from "@/components/FlipDownloaderClient";
import BookActions from "@/components/BookActions";
import PageThumbnails from "@/components/PageThumbnails";
import RelatedBooks from "@/components/RelatedBooks";
import { cleanUrl } from "@/lib/utils";
import { Metadata } from "next";

// 动态生成 metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const book = await getBookById(id);

  if (!book) {
    return {
      title: "Book Not Found - FlipHTML5 Downloader",
      description: "The requested book could not be found.",
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yourdomain.com";
  const thumbnailFull = book.thumbnail.startsWith("http")
    ? book.thumbnail
    : `https://online.fliphtml5.com/${book.id1}/${book.id2}/${cleanUrl(book.thumbnail)}`;

  return {
    title: `${book.title} - FlipHTML5 Book | Download PDF`,
    description: `Download "${book.title}" as high-quality PDF. ${book.pageCount} pages, ${book.downloadCount} downloads. Convert FlipHTML5 flipbook to PDF instantly.`,
    keywords: [
      book.title,
      "fliphtml5",
      "download pdf",
      "flipbook converter",
      `${book.pageCount} pages`,
    ],
    openGraph: {
      title: `${book.title} - FlipHTML5 Book | Download PDF`,
      description: `Download "${book.title}" as high-quality PDF. ${book.pageCount} pages available.`,
      type: "article",
      images: [
        {
          url: thumbnailFull,
          width: 800,
          height: 600,
          alt: book.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${book.title} - FlipHTML5 Book | Download PDF`,
      description: `Download "${book.title}" as high-quality PDF. ${book.pageCount} pages available.`,
      images: [thumbnailFull],
    },
    alternates: {
      canonical: `${baseUrl}/book/${id}`,
    },
  };
}

export default async function BookDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const book = await getBookById(id);

  if (!book) {
    notFound();
  }

  // 获取相关书籍（默认4本）
  const relatedBooksResult = await getRelatedBooks(book.title, id, 6);

  const bookUrl = `https://fliphtml5.com/${book.id1}/${book.id2}`;
  const thumbnailFull = book.thumbnail.startsWith("http")
    ? book.thumbnail
    : `https://online.fliphtml5.com/${book.id1}/${book.id2}/${cleanUrl(book.thumbnail)}`;

  // 结构化数据 (JSON-LD)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    description: `Download "${book.title}" as high-quality PDF from FlipHTML5. ${book.pageCount} pages available.`,
    image: thumbnailFull,
    url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://yourdomain.com"}/book/${id}`,
    numberOfPages: book.pageCount,
    bookFormat: "EBook",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/DownloadAction",
      userInteractionCount: book.downloadCount,
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
        className="min-h-screen bg-[var(--color-bg)] font-body pb-20 overflow-x-hidden"
        suppressHydrationWarning
      >
        {/* Background gradient mesh */}
        <div
          className="fixed inset-0 pointer-events-none overflow-hidden gradient-mesh"
          suppressHydrationWarning
        />

        <div className="relative max-w-6xl mx-auto px-3 sm:px-6 pt-6 sm:pt-12 pb-12 sm:pb-20">
          {/* Back Button - More compact on mobile */}
          <Link
            href="/#discovery-square"
            className="inline-flex items-center gap-1.5 mb-4 sm:mb-8 text-xs sm:text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>

          {/* Main Content Grid - Optimized for mobile */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-10 lg:gap-12 items-start">
            {/* Left: Book Cover preview - Full width on mobile, 4 cols on desktop */}
            <div className="md:col-span-4 flex flex-col gap-3 sm:gap-5">
              {/* Book Cover - Smaller on mobile */}
              <div className="relative aspect-[3/4] w-full max-w-[280px] sm:max-w-none mx-auto md:mx-0 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl sm:shadow-2xl border-2 sm:border-4 border-white transform transition-transform hover:scale-[1.02] duration-500">
                <Image
                  src={thumbnailFull}
                  alt={book.title}
                  fill
                  unoptimized={true}
                  className="object-cover"
                  referrerPolicy="no-referrer"
                  priority
                />
                <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
                  <div className="bg-white/90 backdrop-blur-md px-2.5 sm:px-4 py-1 sm:py-2 rounded-full text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary)] flex items-center gap-1 sm:gap-2 shadow-lg">
                    <Sparkles className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden xs:inline sm:inline">Popular</span>
                  </div>
                </div>
              </div>

              {/* Stats Cards - Horizontal on mobile, vertical on desktop */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                <div className="bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-[var(--color-border-light)] shadow-sm flex flex-col items-center justify-center text-center">
                  <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-secondary)] mb-1.5 sm:mb-2" />
                  <span className="text-lg sm:text-2xl font-display font-bold text-[var(--color-text)]">
                    {book.pageCount}
                  </span>
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[var(--color-text-muted)] mt-0.5 sm:mt-1">
                    Pages
                  </span>
                </div>
                <div className="bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-[var(--color-border-light)] shadow-sm flex flex-col items-center justify-center text-center">
                  <Download className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-primary)] mb-1.5 sm:mb-2" />
                  <span className="text-lg sm:text-2xl font-display font-bold text-[var(--color-text)]">
                    {book.downloadCount}
                  </span>
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[var(--color-text-muted)] mt-0.5 sm:mt-1">
                    Downloads
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Info and Action - Full width on mobile */}
            <div className="md:col-span-8 flex flex-col order-first md:order-last">
              <div className="mb-5 sm:mb-8">
                {/* Title - Better mobile typography */}
                <h1
                  className="font-display text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15] sm:leading-[1.1] mb-3 sm:mb-6 text-[var(--color-text)] break-words"
                  suppressHydrationWarning
                >
                  {book.title}
                </h1>

                {/* Description - Compact on mobile */}
                <p
                  className="text-[var(--color-text-secondary)] leading-relaxed sm:leading-relaxed max-w-3xl mb-5 sm:mb-8 text-sm sm:text-lg font-light"
                  suppressHydrationWarning
                >
                  This publication has been indexed by our community. You can
                  now process it for high-quality PDF conversion or read it
                  directly using our optimized web reader.
                </p>

                {/* Action Buttons */}
                <BookActions
                  id={id}
                  id1={book.id1}
                  id2={book.id2}
                  title={book.title}
                  pageCount={book.pageCount}
                />
              </div>

              {/* Source Info - More compact on mobile */}
              <div className="mt-auto pt-4 sm:pt-0">
                <p
                  className="text-[9px] sm:text-[11px] text-[var(--color-text-muted)] font-medium leading-relaxed"
                  suppressHydrationWarning
                >
                  <span className="sm:hidden">
                    {new Date().toLocaleDateString()}
                  </span>
                  <span className="hidden sm:inline">
                    Retrieved: {new Date().toLocaleDateString()}
                  </span>
                  <br className="sm:hidden" />
                  <span className="sm:hidden">Source: </span>
                  <span className="hidden sm:inline">Book Source: </span>
                  <a href={bookUrl} target="_blank" className="break-all">
                    {bookUrl}
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Page Thumbnails Section */}
          <div className="mt-16 sm:mt-20">
            <PageThumbnails id1={book.id1} id2={book.id2} />
          </div>

          {/* Related Books Section */}
          <RelatedBooks
            books={relatedBooksResult.books}
            total={relatedBooksResult.total}
            hasMore={relatedBooksResult.hasMore}
            currentBookId={id}
          />
        </div>
      </div>
    </>
  );
}
