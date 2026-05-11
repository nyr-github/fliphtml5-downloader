import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Tag } from "lucide-react";
import BookCard from "@/components/BookCard";
import { getBooksByTag } from "@/lib/actions";
import { BOOK_TAGS, slugToTag, tagToSlug } from "@/lib/constants";

interface BooksByTagPageProps {
  params: Promise<{ tag: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({
  params,
}: BooksByTagPageProps): Promise<Metadata> {
  const { tag: tagSlug } = await params;
  const tagName = slugToTag(tagSlug);

  if (!tagName) {
    return {
      title: "Tag Not Found",
    };
  }

  return {
    title: `${tagName} Books - FlipHTML5 Downloader`,
    description: `Browse and download FlipHTML5 books tagged with ${tagName}. Find popular publications in the ${tagName} category.`,
  };
}

export async function generateStaticParams() {
  return BOOK_TAGS.map((tag) => ({
    tag: tagToSlug(tag),
  }));
}

export default async function BooksByTagPage({
  params,
  searchParams,
}: BooksByTagPageProps) {
  const { tag: tagSlug } = await params;
  const { page: pageStr } = await searchParams;

  const tagName = slugToTag(tagSlug);

  if (!tagName) {
    notFound();
  }

  const currentPage = parseInt(pageStr || "1");
  const result = await getBooksByTag(tagName, currentPage, 12);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-bg)] via-[var(--color-bg)] to-[var(--color-bg-warm)]">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-24 sm:pt-28 pb-16 sm:pb-20">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 mb-6 sm:mb-8 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] rounded-xl flex items-center justify-center shadow-lg">
              <Tag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[var(--color-text)]">
                {tagName}
              </h1>
              <p className="text-sm sm:text-base text-[var(--color-text-secondary)] mt-1">
                {result.total} book{result.total !== 1 ? "s" : ""} in {tagName}{" "}
                category
              </p>
            </div>
          </div>
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
                  href={`/books/${tagSlug}?page=${currentPage - 1}`}
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
                        href={`/books/${tagSlug}?page=${pageNum}`}
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
                  href={`/books/${tagSlug}?page=${currentPage + 1}`}
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
              There are no books tagged with "{tagName}" yet. Check back later
              or explore other categories.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
