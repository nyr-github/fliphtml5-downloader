import React from "react";
import { Calendar, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import BookCard from "@/components/BookCard";
import { getBooksByDate, getAvailableDates } from "@/lib/actions/daily-books";
import { Metadata } from "next";
import Link from "next/link";

interface PageProps {
  params: Promise<{ date: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { date } = await params;
  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return {
    title: `Books Added on ${formattedDate} - FlipHTML5 Downloader`,
    description: `Browse FlipHTML5 flipbooks added on ${formattedDate}. Discover new publications added to our collection.`,
    openGraph: {
      title: `Books Added on ${formattedDate} - FlipHTML5 Downloader`,
      description: `Browse FlipHTML5 flipbooks added on ${formattedDate}.`,
      type: "website",
    },
  };
}

export default async function DailyBooksPage({ params }: PageProps) {
  const { date } = await params;

  // 获取指定日期的书籍
  const dailyBooksResult = await getBooksByDate(date);

  // 获取所有可用日期用于导航
  const availableDatesResult = await getAvailableDates();
  const availableDates = availableDatesResult.dates;

  // 找到当前日期在列表中的位置（列表按降序排列，最新的在前）
  const currentIndex = availableDates.indexOf(date);
  const hasNewer = currentIndex > 0; // 是否有更新的日期（后一天）
  const hasOlder = currentIndex < availableDates.length - 1; // 是否有更早的日期（前一天）

  // 获取前一天和后一天的日期
  // 注意：availableDates是降序排列，所以索引+1是更早的日期，索引-1是更新的日期
  const previousDate = hasOlder ? availableDates[currentIndex + 1] : null; // 前一天（更早）
  const nextDate = hasNewer ? availableDates[currentIndex - 1] : null; // 后一天（更新）

  // 格式化日期显示
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  // 格式化简短日期
  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div
      className="min-h-screen bg-[var(--color-bg)] font-body overflow-x-hidden"
      suppressHydrationWarning
    >
      {/* Background gradient mesh */}
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden gradient-mesh"
        suppressHydrationWarning
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
        {/* Header Section */}
        <div className="mb-8 sm:mb-12 text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 rounded-xl flex items-center justify-center border border-[var(--color-primary)]/20">
              <Calendar className="w-6 h-6 text-[var(--color-primary)]" />
            </div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--color-text)]">
              Daily New Books
            </h1>
          </div>
          <p className="text-sm sm:text-base md:text-lg text-[var(--color-text-secondary)] font-light leading-relaxed max-w-2xl mx-auto px-2">
            Discover the latest FlipHTML5 flipbooks added to our collection,
            organized by date.
          </p>
        </div>

        {/* Date Navigation */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            {/* Previous Day Button */}
            {previousDate ? (
              <Link
                href={`/books/date/${previousDate}`}
                className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-white rounded-xl border-2 border-[var(--color-border)] shadow-sm hover:border-[var(--color-primary)] hover:shadow-md transition-all"
              >
                <ChevronLeft className="w-5 h-5 text-[var(--color-text-muted)]" />
                <div className="hidden sm:block">
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Previous
                  </p>
                  <p className="text-sm font-semibold text-[var(--color-text)]">
                    {formatShortDate(previousDate)}
                  </p>
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-white/50 rounded-xl border-2 border-[var(--color-border)] opacity-50 cursor-not-allowed">
                <ChevronLeft className="w-5 h-5 text-[var(--color-text-muted)]" />
                <div className="hidden sm:block">
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Previous
                  </p>
                  <p className="text-sm font-semibold text-[var(--color-text)]">
                    No earlier dates
                  </p>
                </div>
              </div>
            )}

            {/* Current Date Display */}
            <div className="px-6 sm:px-8 py-3 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] rounded-xl shadow-lg text-white">
              <div className="text-center">
                <p className="text-xs opacity-80 mb-1">Viewing</p>
                <p className="text-base sm:text-lg font-bold">
                  {formatDate(date)}
                </p>
              </div>
            </div>

            {/* Next Day Button */}
            {nextDate ? (
              <Link
                href={`/books/date/${nextDate}`}
                className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-white rounded-xl border-2 border-[var(--color-border)] shadow-sm hover:border-[var(--color-primary)] hover:shadow-md transition-all"
              >
                <div className="hidden sm:block">
                  <p className="text-xs text-[var(--color-text-muted)]">Next</p>
                  <p className="text-sm font-semibold text-[var(--color-text)]">
                    {formatShortDate(nextDate)}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-[var(--color-text-muted)]" />
              </Link>
            ) : (
              <div className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-white/50 rounded-xl border-2 border-[var(--color-border)] opacity-50 cursor-not-allowed">
                <div className="hidden sm:block">
                  <p className="text-xs text-[var(--color-text-muted)]">Next</p>
                  <p className="text-sm font-semibold text-[var(--color-text)]">
                    No later dates
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-[var(--color-text-muted)]" />
              </div>
            )}
          </div>
        </div>

        {/* Books Display */}
        <div className="mb-10 sm:mb-16">
          {dailyBooksResult.books.length === 0 ? (
            <div className="text-center py-16 sm:py-24 bg-white rounded-2xl sm:rounded-3xl border-2 border-dashed border-[var(--color-border)] mx-2">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[var(--color-bg-warm)] rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-5">
                <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--color-text-muted)]" />
              </div>
              <p className="text-[var(--color-text-muted)] text-base sm:text-lg font-medium px-4">
                No books added on this date
              </p>
            </div>
          ) : (
            <>
              {/* Book count header */}
              <div className="flex items-center gap-3 mb-6 sm:mb-8">
                <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] rounded-lg flex items-center justify-center shadow-md">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--color-text)]">
                    {formatDate(date)}
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">
                    {dailyBooksResult.books.length} book
                    {dailyBooksResult.books.length !== 1 ? "s" : ""} added
                  </p>
                </div>
              </div>

              {/* Books Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {dailyBooksResult.books.map((book, index) => (
                  <BookCard key={book.id} book={book} index={index} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
