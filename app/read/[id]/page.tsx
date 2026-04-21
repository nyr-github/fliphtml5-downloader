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
      title: "Book Not Found - FlipBook Downloader",
      description: "The requested book could not be found.",
    };
  }

  return {
    title: `${book.title} - FlipBook Downloader`,
    description: `Read "${book.title}" online with our optimized reader. ${book.pageCount} pages available.`,
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

  return (
    <div className="bg-black min-h-screen mobile-safe-bottom mobile-safe-top">
      <BookReaderClient
        dbId={id}
        id1={book.id1}
        id2={book.id2}
        title={book.title}
      />
    </div>
  );
}
