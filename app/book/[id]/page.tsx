import React from "react";
import { getBookById } from "@/lib/actions";
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
    : `https://online.fliphtml5.com/${book.id1}/${book.id2}/${book.thumbnail.replace("./", "")}`;

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

  const bookUrl = `https://fliphtml5.com/${book.id1}/${book.id2}`;
  const thumbnailFull = book.thumbnail.startsWith("http")
    ? book.thumbnail
    : `https://online.fliphtml5.com/${book.id1}/${book.id2}/${book.thumbnail.replace("./", "")}`;

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

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-16 sm:pb-20">
          {/* Back Button */}
          <Link
            href="/#discovery-square"
            className="inline-flex items-center gap-2 mb-6 sm:mb-8 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-12 items-start">
            {/* Left: Book Cover preview */}
            <div className="md:col-span-4 flex flex-col gap-4 sm:gap-6">
              <div className="relative aspect-[3/4] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-2 sm:border-4 border-white transform transition-transform hover:scale-[1.02] duration-500">
                <Image
                  src={thumbnailFull}
                  alt={book.title}
                  fill
                  unoptimized={true}
                  className="object-cover"
                  referrerPolicy="no-referrer"
                  priority
                />
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                  <div className="bg-white/90 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary)] flex items-center gap-1.5 sm:gap-2 shadow-lg">
                    <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    Popular
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-[var(--color-border-light)] shadow-sm flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-2">
                    Total Pages
                  </span>
                  <span className="text-xl sm:text-2xl font-display font-bold text-[var(--color-text)] flex items-center gap-2">
                    <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-secondary)]" />
                    {book.pageCount}
                  </span>
                </div>
                <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-[var(--color-border-light)] shadow-sm flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-2">
                    Downloads
                  </span>
                  <span className="text-xl sm:text-2xl font-display font-bold text-[var(--color-text)] flex items-center gap-2">
                    <Download className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-primary)]" />
                    {book.downloadCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Info and Action */}
            <div className="md:col-span-8 flex flex-col">
              <div className="mb-6 sm:mb-8">
                <h1
                  className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mb-4 sm:mb-6 text-[var(--color-text)]"
                  suppressHydrationWarning
                >
                  {book.title}
                </h1>
                <p
                  className="text-[var(--color-text-secondary)] leading-relaxed max-w-3xl mb-6 sm:mb-8 text-base sm:text-lg font-light px-2"
                  suppressHydrationWarning
                >
                  This publication has been indexed by our community. You can
                  now process it for high-quality PDF conversion or read it
                  directly using our optimized web reader.
                </p>

                <BookActions id={id} id1={book.id1} id2={book.id2} />
              </div>

              <div className="mt-auto">
                <p
                  className="text-[10px] sm:text-[11px] text-[var(--color-text-muted)] font-medium leading-relaxed px-2"
                  suppressHydrationWarning
                >
                  Retrieved: {new Date().toLocaleDateString()}
                  <br />
                  Book Source:{" "}
                  <a href={bookUrl} target="_blank">
                    {bookUrl}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
