"use client";

import React from "react";
import { Book, ChevronLeft, ChevronRight } from "lucide-react";
import BookCard from "@/components/BookCard";
import { ExploreBook } from "@/lib/actions";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface BookListClientProps {
  books: ExploreBook[];
  currentPage: number;
  totalPages: number;
}

export default function BookListClient({
  books,
  currentPage,
  totalPages,
}: BookListClientProps) {
  const searchParams = useSearchParams();

  if (books.length === 0) {
    return (
      <div className="text-center py-16 sm:py-24 bg-white rounded-2xl sm:rounded-3xl border-2 border-dashed border-[var(--color-border)] mx-2">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[var(--color-bg-warm)] rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-5">
          <Book className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--color-text-muted)]" />
        </div>
        <p className="text-[var(--color-text-muted)] text-base sm:text-lg font-medium px-4">
          No books have been shared yet
        </p>
        <p className="text-[var(--color-text-muted)] text-xs sm:text-sm mt-2 opacity-60 px-4">
          Be the first to download and share!
        </p>
      </div>
    );
  }

  // Generate pagination links
  const getPaginationLink = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    return `?${params.toString()}`;
  };

  // Calculate which page numbers to show
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else if (currentPage <= 3) {
      for (let i = 1; i <= maxVisible; i++) {
        pages.push(i);
      }
    } else if (currentPage >= totalPages - 2) {
      for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      for (let i = currentPage - 2; i <= currentPage + 2; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {books.map((book, index) => (
          <BookCard key={book.id} book={book} index={index} />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2 mt-8 sm:mt-12">
        {currentPage > 1 ? (
          <Link
            href={getPaginationLink(currentPage - 1)}
            className="flex items-center gap-1 px-3 sm:px-4 py-2 bg-white rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </Link>
        ) : (
          <div className="flex items-center gap-1 px-3 sm:px-4 py-2 bg-white rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-text)] opacity-50 cursor-not-allowed">
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </div>
        )}

        <div className="flex items-center gap-1">
          {getPageNumbers().map((pageNum) => (
            <Link
              key={pageNum}
              href={getPaginationLink(pageNum)}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                currentPage === pageNum
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-white border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg)]"
              }`}
            >
              {pageNum}
            </Link>
          ))}
        </div>

        {currentPage < totalPages ? (
          <Link
            href={getPaginationLink(currentPage + 1)}
            className="flex items-center gap-1 px-3 sm:px-4 py-2 bg-white rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)] transition-colors"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <div className="flex items-center gap-1 px-3 sm:px-4 py-2 bg-white rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-text)] opacity-50 cursor-not-allowed">
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );
}
