import React from "react";
import Link from "next/link";
import BookCard from "./BookCard";
import { ArrowRight } from "lucide-react";
import { ExploreBook } from "@/lib/actions";

interface RelatedBooksProps {
  books: ExploreBook[];
  total: number;
  hasMore: boolean;
  currentBookId: string;
}

export default function RelatedBooks({
  books,
  total,
  hasMore,
  currentBookId,
}: RelatedBooksProps) {
  if (books.length === 0) {
    return null;
  }

  return (
    <div className="mt-16 sm:mt-20">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--color-text)]">
            Related Books
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {total} book{total !== 1 ? "s" : ""} found based on topic similarity
          </p>
        </div>
        {hasMore && (
          <Link
            href={`/book/${currentBookId}/related`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors group"
          >
            View All
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
        {books.map((book, index) => (
          <BookCard key={book.id} book={book} index={index} />
        ))}
      </div>
    </div>
  );
}
