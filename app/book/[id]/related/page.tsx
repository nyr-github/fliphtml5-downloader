import React from "react";
import { getBookById, getAllRelatedBooks } from "@/lib/actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import BookCard from "@/components/BookCard";
import { Metadata } from "next";

// 动态生成 metadata
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const book = await getBookById(id);

  if (!book) {
    return {
      title: "Book Not Found - FlipHTML5 Downloader",
      description: "The requested book could not be found.",
    };
  }

  const { page } = await searchParams;
  const currentPage = page ? parseInt(page) : 1;

  return {
    title: `Related Books to "${book.title}" - Page ${currentPage} | FlipHTML5 Downloader`,
    description: `Explore books related to "${book.title}". Discover similar content and topics.`,
  };
}

export default async function RelatedBooksPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page } = await searchParams;

  const currentBook = await getBookById(id);
  if (!currentBook) {
    notFound();
  }

  const currentPage = page ? parseInt(page) : 1;
  const pageSize = 24;

  const relatedBooksResult = await getAllRelatedBooks(
    currentBook.title,
    id,
    currentPage,
    pageSize,
  );

  const { books, total, totalPages } = relatedBooksResult;

  // 生成分页按钮
  const generatePaginationButtons = () => {
    const buttons: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // 如果总页数小于等于最大可见数，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        buttons.push(i);
      }
    } else {
      // 总是显示第一页
      buttons.push(1);

      if (currentPage > 3) {
        buttons.push("...");
      }

      // 显示当前页附近的页码
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        buttons.push(i);
      }

      if (currentPage < totalPages - 2) {
        buttons.push("...");
      }

      // 总是显示最后一页
      buttons.push(totalPages);
    }

    return buttons;
  };

  return (
    <div
      className="min-h-screen bg-[var(--color-bg)] font-body pb-20 overflow-x-hidden"
      suppressHydrationWarning
    >
      {/* Background gradient mesh */}
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden gradient-mesh"
        suppressHydrationWarning
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-16 sm:pb-20">
        {/* Back Button */}
        <Link
          href={`/book/${id}`}
          className="inline-flex items-center gap-2 mb-6 sm:mb-8 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to {currentBook.title}
        </Link>

        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-[1.1] mb-3 sm:mb-4 text-[var(--color-text)]">
            Related Books
          </h1>
          <p className="text-[var(--color-text-secondary)] text-base sm:text-lg max-w-3xl">
            Books related to "{currentBook.title}"
          </p>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">
            {total} book{total !== 1 ? "s" : ""} found • Page {currentPage} of{" "}
            {totalPages}
          </p>
        </div>

        {/* Books Grid */}
        {books.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6 mb-12 sm:mb-16">
              {books.map((book, index) => (
                <BookCard key={book.id} book={book} index={index} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                {/* Previous Button */}
                <Link
                  href={
                    currentPage > 1
                      ? `/book/${id}/related?page=${currentPage - 1}`
                      : `/book/${id}/related`
                  }
                  className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    currentPage === 1
                      ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400"
                      : "bg-white text-[var(--color-text)] hover:bg-[var(--color-primary)] hover:text-white border border-[var(--color-border-light)]"
                  }`}
                  aria-disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Link>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {generatePaginationButtons().map((btn, idx) => {
                    if (btn === "...") {
                      return (
                        <span
                          key={`ellipsis-${idx}`}
                          className="px-2 py-2 text-sm text-[var(--color-text-muted)]"
                        >
                          ...
                        </span>
                      );
                    }

                    const pageNum = btn as number;
                    const isActive = pageNum === currentPage;

                    return (
                      <Link
                        key={pageNum}
                        href={
                          pageNum === 1
                            ? `/book/${id}/related`
                            : `/book/${id}/related?page=${pageNum}`
                        }
                        className={`min-w-[40px] h-10 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center ${
                          isActive
                            ? "bg-[var(--color-primary)] text-white"
                            : "bg-white text-[var(--color-text)] hover:bg-[var(--color-primary)] hover:text-white border border-[var(--color-border-light)]"
                        }`}
                      >
                        {pageNum}
                      </Link>
                    );
                  })}
                </div>

                {/* Next Button */}
                <Link
                  href={
                    currentPage < totalPages
                      ? `/book/${id}/related?page=${currentPage + 1}`
                      : `/book/${id}/related?page=${totalPages}`
                  }
                  className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    currentPage === totalPages
                      ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400"
                      : "bg-white text-[var(--color-text)] hover:bg-[var(--color-primary)] hover:text-white border border-[var(--color-border-light)]"
                  }`}
                  aria-disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-lg text-[var(--color-text-secondary)]">
              No related books found.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
