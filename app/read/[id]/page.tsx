import React from "react";
import { getBookById } from "@/lib/actions";
import { notFound } from "next/navigation";
import BookReaderClient from "@/components/BookReaderClient";
import { buildThumbnailUrl } from "@/lib/utils";
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
  const thumbnailFull = buildThumbnailUrl(book.thumbnail, book.id1, book.id2);

  return {
    title: `Read ${book.title} Online - Free FlipBook Reader`,
    description:
      book.description ||
      `Read "${book.title}" online with our optimized flipbook reader. ${book.pageCount} pages available. Free online flipbook viewer.`,
    keywords: [
      book.title,
      "online flipbook reader",
      "read flipbook online",
      "free flipbook viewer",
      `${book.pageCount} pages`,
    ],
    openGraph: {
      title: `Read ${book.title} Online - Free FlipBook Reader`,
      description:
        book.description ||
        `Read "${book.title}" online with our optimized flipbook reader. ${book.pageCount} pages available.`,
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
      title: `Read ${book.title} Online - Free FlipBook Reader`,
      description:
        book.description ||
        `Read "${book.title}" online with our optimized flipbook reader. ${book.pageCount} pages available.`,
      images: [thumbnailFull],
    },
    alternates: {
      canonical: `${baseUrl}/read/${id}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ReaderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const book = await getBookById(id);

  if (!book) {
    notFound();
  }

  const thumbnailFull = buildThumbnailUrl(book.thumbnail, book.id1, book.id2);

  // 结构化数据 (JSON-LD)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Read ${book.title} Online`,
    description:
      book.description ||
      `Read "${book.title}" online with our optimized flipbook reader. ${book.pageCount} pages available.`,
    url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://yourdomain.com"}/read/${id}`,
    isPartOf: {
      "@type": "WebSite",
      name: "FlipHTML5 Downloader",
      url: process.env.NEXT_PUBLIC_BASE_URL || "https://yourdomain.com",
    },
    about: {
      "@type": "Book",
      name: book.title,
      description: book.description,
      numberOfPages: book.pageCount,
      image: thumbnailFull,
    },
  };

  return (
    <>
      {/* JSON-LD 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="bg-black min-h-screen mobile-safe-bottom mobile-safe-top">
        <BookReaderClient
          dbId={id}
          id1={book.id1}
          id2={book.id2}
          title={book.title}
          from={from}
        />

        {/* PDF.co Promotion Banner */}
        <div className="fixed bottom-0 left-0 right-0 z-50 p-2 sm:p-3 bg-gradient-to-r from-[#e85d26]/95 to-[#f4a261]/95 backdrop-blur-md border-t border-[#f4a261]/40">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs sm:text-sm font-medium truncate">
                <span className="hidden sm:inline">
                  Need PDF OCR or conversion? Try{" "}
                </span>
                <span className="sm:hidden">Try </span>
                <a
                  href="https://app.pdf.co/?via=aivaded"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold underline hover:text-[#fef08a]"
                >
                  PDF.co
                </a>
                <span className="hidden sm:inline">
                  {" "}
                  for advanced document tools
                </span>
              </p>
            </div>
            <a
              href="https://app.pdf.co/?via=aivaded"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 bg-white text-[#e85d26] text-xs sm:text-sm font-bold rounded-lg hover:bg-[#fff5f0] transition-colors shadow-md whitespace-nowrap"
            >
              Try Free →
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
