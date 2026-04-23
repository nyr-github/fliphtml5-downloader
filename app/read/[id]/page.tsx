import React from "react";
import { getBookById } from "@/lib/actions";
import { notFound } from "next/navigation";
import BookReaderClient from "@/components/BookReaderClient";
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
    title: `Read ${book.title} Online - Free FlipBook Reader`,
    description: `Read "${book.title}" online with our optimized flipbook reader. ${book.pageCount} pages available. Free online flipbook viewer.`,
    keywords: [
      book.title,
      "online flipbook reader",
      "read flipbook online",
      "free flipbook viewer",
      `${book.pageCount} pages`,
    ],
    openGraph: {
      title: `Read ${book.title} Online - Free FlipBook Reader`,
      description: `Read "${book.title}" online with our optimized flipbook reader. ${book.pageCount} pages available.`,
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
      description: `Read "${book.title}" online with our optimized flipbook reader. ${book.pageCount} pages available.`,
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
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const book = await getBookById(id);

  if (!book) {
    notFound();
  }

  const thumbnailFull = book.thumbnail.startsWith("http")
    ? book.thumbnail
    : `https://online.fliphtml5.com/${book.id1}/${book.id2}/${book.thumbnail.replace("./", "")}`;

  // 结构化数据 (JSON-LD)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Read ${book.title} Online`,
    description: `Read "${book.title}" online with our optimized flipbook reader. ${book.pageCount} pages available.`,
    url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://yourdomain.com"}/read/${id}`,
    isPartOf: {
      "@type": "WebSite",
      name: "FlipHTML5 Downloader",
      url: process.env.NEXT_PUBLIC_BASE_URL || "https://yourdomain.com",
    },
    about: {
      "@type": "Book",
      name: book.title,
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
        />
      </div>
    </>
  );
}
