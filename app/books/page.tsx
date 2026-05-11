import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Tag } from "lucide-react";
import BookCard from "@/components/BookCard";
import { getBooksByTag, getBooksPaginated } from "@/lib/actions";
import { BOOK_TAGS, slugToTag, tagToSlug } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Browse Books by Category - FlipHTML5 Downloader",
  description:
    "Explore FlipHTML5 books organized by categories. Browse Business, Education, Arts & Culture, Science & Technology, and more.",
};

interface BooksPageProps {
  searchParams: Promise<{ tag?: string; page?: string }>;
}

export default async function BooksPage({ searchParams }: BooksPageProps) {
  const { tag: tagSlug, page: pageStr } = await searchParams;

  // 判断是否是"All"模式（没有tag参数或tag为"all"）
  const isAllMode = !tagSlug || tagSlug.toLowerCase() === "all";

  // 如果不是All模式，验证并获取对应的标签
  let currentTag: string | undefined;
  let currentTagSlug: string;

  if (!isAllMode) {
    currentTag = slugToTag(tagSlug);
    if (!currentTag) {
      notFound();
    }
    currentTagSlug = tagToSlug(currentTag);
  } else {
    currentTagSlug = "all";
  }

  const currentPage = parseInt(pageStr || "1");

  // 根据模式获取书籍
  const result = isAllMode
    ? await getBooksPaginated(currentPage, 12)
    : await getBooksByTag(currentTag!, currentPage, 12);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-bg)] via-[var(--color-bg)] to-[var(--color-bg-warm)]">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-24 sm:pt-28 pb-16 sm:pb-20">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] rounded-xl flex items-center justify-center shadow-lg">
              <Tag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[var(--color-text)]">
                Browse by Category
              </h1>
              <p className="text-sm sm:text-base text-[var(--color-text-secondary)] mt-1">
                Explore our collection of FlipHTML5 books organized by topic
              </p>
            </div>
          </div>

          {/* Tag Navigation */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {/* All Button */}
            <Link
              href="/books"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                isAllMode
                  ? "bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white shadow-lg scale-105"
                  : "bg-white border border-[var(--color-border-light)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:shadow-md"
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              All
            </Link>

            {/* Tag Buttons */}
            {BOOK_TAGS.map((tag) => {
              const slug = tagToSlug(tag);
              const isActive = tag === currentTag;

              return (
                <Link
                  key={tag}
                  href={`/books?tag=${slug}`}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white shadow-lg scale-105"
                      : "bg-white border border-[var(--color-border-light)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:shadow-md"
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  {tag}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Category Info */}
        <div className="mb-6 sm:mb-8 pb-4 border-b border-[var(--color-border-light)]">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--color-text)] mb-2">
            {isAllMode ? "All Books" : currentTag}
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {result.total} book{result.total !== 1 ? "s" : ""}
            {isAllMode ? " available" : ` in ${currentTag} category`}
          </p>
        </div>

        {/* Books Grid */}
        {result.books.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6 mb-12 sm:mb-16">
              {result.books.map((book, index) => (
                <BookCard key={book.id} book={book} index={index} />
              ))}
            </div>

            {/* Pagination */}
            {result.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                {/* Previous Button */}
                <Link
                  href={
                    isAllMode
                      ? currentPage === 2
                        ? "/books"
                        : `/books?page=${currentPage - 1}`
                      : `/books?tag=${currentTagSlug}&page=${currentPage - 1}`
                  }
                  className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    currentPage === 1
                      ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400"
                      : "bg-white border border-[var(--color-border-light)] text-[var(--color-text)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                  }`}
                  aria-disabled={currentPage === 1}
                  tabIndex={currentPage === 1 ? -1 : undefined}
                >
                  ← Previous
                </Link>

                {/* Page Numbers */}
                {Array.from(
                  { length: Math.min(result.totalPages, 5) },
                  (_, i) => {
                    let pageNum: number;
                    if (result.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= result.totalPages - 2) {
                      pageNum = result.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Link
                        key={pageNum}
                        href={
                          isAllMode
                            ? pageNum === 1
                              ? "/books"
                              : `/books?page=${pageNum}`
                            : `/books?tag=${currentTagSlug}&page=${pageNum}`
                        }
                        className={`min-w-[40px] h-10 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                          currentPage === pageNum
                            ? "bg-[var(--color-primary)] text-white"
                            : "bg-white border border-[var(--color-border-light)] text-[var(--color-text)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                        }`}
                      >
                        {pageNum}
                      </Link>
                    );
                  },
                )}

                {/* Next Button */}
                <Link
                  href={`/books?${isAllMode ? "" : `tag=${currentTagSlug}&`}page=${currentPage + 1}`}
                  className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    currentPage === result.totalPages
                      ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400"
                      : "bg-white border border-[var(--color-border-light)] text-[var(--color-text)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                  }`}
                  aria-disabled={currentPage === result.totalPages}
                  tabIndex={currentPage === result.totalPages ? -1 : undefined}
                >
                  Next →
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 sm:py-24">
            <div className="w-24 h-24 mx-auto mb-6 bg-[var(--color-primary)]/10 rounded-full flex items-center justify-center">
              <Tag className="w-12 h-12 text-[var(--color-primary)]" />
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--color-text)] mb-3">
              No books found
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-6 sm:mb-8 max-w-md mx-auto">
              {isAllMode
                ? "There are no books available yet. Check back later."
                : `There are no books tagged with "${currentTag}" yet. Check back later or explore other categories.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
