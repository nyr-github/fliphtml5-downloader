import React from "react";
import { getBookById, getAllRelatedBooks } from "@/lib/actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import BookCard from "@/components/BookCard";
import RelatedBooksControls from "@/components/RelatedBooksControls";
import { Metadata } from "next";

// 动态生成 metadata
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; sortBy?: string; sortOrder?: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const book = await getBookById(id);

  if (!book) {
    return {
      title: "Book Not Found - FlipHTML5 Downloader",
      description: "The requested book could not be found.",
    };
  }

  const { page, sortBy, sortOrder } = await searchParams;
  const currentPage = page ? parseInt(page) : 1;
  const sortLabel = sortBy === "downloads" ? "Downloads" : "Name";
  const orderLabel = sortOrder === "desc" ? "(Z-A)" : "(A-Z)";

  return {
    title: `Related Books to "${book.title}" - Page ${currentPage} | Sort by ${sortLabel} ${orderLabel} | FlipHTML5 Downloader`,
    description: `Explore books related to "${book.title}". Discover similar content and topics. Sorted by ${sortLabel.toLowerCase()} ${orderLabel}.`,
  };
}

export default async function RelatedBooksPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    page?: string;
    sortBy?: string;
    sortOrder?: string;
    layout?: string;
  }>;
}) {
  const { id } = await params;
  const { page, sortBy, sortOrder, layout } = await searchParams;

  const currentBook = await getBookById(id);
  if (!currentBook) {
    notFound();
  }

  const currentPage = page ? parseInt(page) : 1;
  const pageSize = 24;
  const currentSortBy = (sortBy === "downloads" ? "downloads" : "name") as
    | "name"
    | "downloads";
  const currentSortOrder = (sortOrder === "desc" ? "desc" : "asc") as
    | "asc"
    | "desc";
  const currentLayout = (layout === "list" ? "list" : "grid") as
    | "grid"
    | "list";

  const relatedBooksResult = await getAllRelatedBooks(
    currentBook.title,
    id,
    currentPage,
    pageSize,
    currentSortBy,
    currentSortOrder,
  );

  const { books, total, totalPages } = relatedBooksResult;

  // 生成分页 URL 的辅助函数，保持排序和布局参数
  const generatePageUrl = (page: number) => {
    const params = new URLSearchParams();

    // 只有不是第一页时才添加 page 参数
    if (page > 1) {
      params.set("page", page.toString());
    }

    // 保持当前的排序参数
    if (sortBy && sortBy !== "name") {
      params.set("sortBy", sortBy);
    }
    if (sortOrder && sortOrder !== "asc") {
      params.set("sortOrder", sortOrder);
    }

    // 保持当前的布局参数
    if (layout && layout !== "grid") {
      params.set("layout", layout);
    }

    const queryString = params.toString();
    return queryString
      ? `/book/${id}/related?${queryString}`
      : `/book/${id}/related`;
  };

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
          className="inline-flex items-center gap-1.5 sm:gap-2 mb-4 sm:mb-6 md:mb-8 text-xs sm:text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="truncate max-w-[200px] sm:max-w-none">
            Back to {currentBook.title}
          </span>
        </Link>

        {/* Header */}
        <div className="mb-6 sm:mb-8 md:mb-12">
          <h1 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight leading-[1.1] mb-2 sm:mb-3 md:mb-4 text-[var(--color-text)]">
            Related Books
          </h1>
          <p className="text-[var(--color-text-secondary)] text-sm sm:text-base md:text-lg max-w-3xl line-clamp-2">
            Books related to "{currentBook.title}"
          </p>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1.5 sm:mt-2">
            {total} book{total !== 1 ? "s" : ""} found • Page {currentPage} of{" "}
            {totalPages}
          </p>
        </div>

        {/* Controls */}
        <RelatedBooksControls
          bookId={id}
          currentBookTitle={currentBook.title}
        />

        {/* Books Grid/List */}
        {books.length > 0 ? (
          <>
            {currentLayout === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6 mb-12 sm:mb-16">
                {books.map((book, index) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    index={index}
                    variant="grid"
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4 mb-12 sm:mb-16">
                {books.map((book, index) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    index={index}
                    variant="list"
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                {/* Previous Button */}
                <Link
                  href={generatePageUrl(currentPage - 1)}
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
                        href={generatePageUrl(pageNum)}
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
                  href={generatePageUrl(Math.min(currentPage + 1, totalPages))}
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
