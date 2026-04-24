"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Clock, Trash2, ExternalLink, Layers } from "lucide-react";
import {
  readingProgressDB,
  isIndexedDBSupported,
  ReadingProgress,
} from "@/lib/reading-progress-db";
import { buildThumbnailUrl } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface HistoryBook extends ReadingProgress {
  thumbnailUrl: string;
  readProgress: number;
  timeAgo: string;
}

export default function ReadingHistoryClient() {
  const [books, setBooks] = useState<HistoryBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [supported, setSupported] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    const checkSupport = isIndexedDBSupported();
    setSupported(checkSupport);

    if (checkSupport) {
      loadHistory();
    } else {
      setLoading(false);
    }
  }, []);

  const loadHistory = async () => {
    try {
      const progressList = await readingProgressDB.getAllProgress();

      const historyBooks: HistoryBook[] = progressList.map((progress) => {
        const thumbnailUrl = buildThumbnailUrl(
          progress.thumbnail || "",
          progress.id1 || "",
          progress.id2 || "",
        );

        const readProgress =
          progress.totalPages > 0
            ? Math.round(
                ((progress.currentPage + 1) / progress.totalPages) * 100,
              )
            : 0;

        const timeAgo = getTimeAgo(progress.lastReadAt);

        return {
          ...progress,
          thumbnailUrl,
          readProgress,
          timeAgo,
        };
      });

      setBooks(historyBooks);
    } catch (err) {
      console.error("Failed to load reading history:", err);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)} weeks ago`;
    if (seconds < 31536000)
      return `${Math.floor(seconds / 2592000)} months ago`;
    return `${Math.floor(seconds / 31536000)} years ago`;
  };

  const handleDelete = async (bookId: string) => {
    setDeleteConfirm(bookId);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await readingProgressDB.deleteProgress(deleteConfirm);
      setBooks(books.filter((book) => book.bookId !== deleteConfirm));
    } catch (err) {
      console.error("Failed to delete history:", err);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear all reading history?")) {
      return;
    }

    try {
      for (const book of books) {
        await readingProgressDB.deleteProgress(book.bookId);
      }
      setBooks([]);
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  if (!supported) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-yellow-500/10 rounded-full flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-yellow-500" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--color-text)] mb-3">
              Reading History
            </h1>
            <p className="text-[var(--color-text-secondary)] max-w-md mx-auto">
              Your browser doesn't support IndexedDB. Reading history feature is
              not available.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 rounded-xl sm:rounded-2xl flex items-center justify-center border border-[var(--color-primary)]/20">
                <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--color-primary)]" />
              </div>
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text)]">
                  Reading History
                </h1>
                <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
                  {books.length} {books.length === 1 ? "book" : "books"} in your
                  history
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-md border border-[var(--color-border-light)] animate-pulse"
              >
                <div className="aspect-[3/4] bg-[var(--color-bg-warm)]" />
                <div className="p-3 sm:p-4 space-y-3">
                  <div className="h-4 bg-[var(--color-bg-warm)] rounded w-3/4" />
                  <div className="h-3 bg-[var(--color-bg-warm)] rounded w-1/2" />
                  <div className="h-2 bg-[var(--color-bg-warm)] rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 sm:py-24">
            <div className="w-24 h-24 mx-auto mb-6 bg-[var(--color-primary)]/10 rounded-full flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-[var(--color-primary)]" />
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--color-text)] mb-3">
              No reading history yet
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-6 sm:mb-8 max-w-md mx-auto">
              Start reading books and your progress will be automatically saved
              here.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <ExternalLink className="w-5 h-5" />
              Explore Books
            </Link>
          </div>
        ) : (
          /* Books Grid */
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
            <AnimatePresence>
              {books.map((book, index) => (
                <motion.div
                  key={book.bookId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="group bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all border border-[var(--color-border-light)] flex flex-col hover-lift"
                >
                  {/* Thumbnail */}
                  <Link
                    href={`/read/${book.bookId}?from=history`}
                    className="relative aspect-[3/4] overflow-hidden bg-[var(--color-bg-warm)] block"
                  >
                    <Image
                      src={book.thumbnailUrl}
                      alt={book.title || "Book"}
                      fill
                      unoptimized={true}
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />

                    {/* Progress Bar Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/30">
                      <div
                        className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] transition-all duration-300"
                        style={{ width: `${book.readProgress}%` }}
                      />
                    </div>

                    {/* Progress Badge */}
                    <div className="absolute top-3 right-3 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-lg text-white text-xs font-bold">
                      {book.readProgress}%
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="p-3 sm:p-4 flex-1 flex flex-col">
                    <Link href={`/book/${book.bookId}`} className="block mb-2">
                      <h3 className="font-display font-bold text-sm sm:text-base text-[var(--color-text)] line-clamp-2 leading-tight group-hover:text-[var(--color-primary)] transition-colors">
                        {book.title || "Untitled Book"}
                      </h3>
                    </Link>

                    <div className="mt-auto space-y-2">
                      {/* Stats */}
                      <div className="flex items-center justify-between text-[10px] sm:text-xs text-[var(--color-text-muted)]">
                        <span className="flex items-center gap-1.5">
                          <Layers className="w-3 h-3" />
                          Page {book.currentPage + 1} / {book.totalPages}
                        </span>
                        {/* <span className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {book.timeAgo}
                        </span> */}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-border-light)]">
                        <Link
                          href={`/read/${book.bookId}?from=history`}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white text-xs font-bold rounded-lg hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          Continue
                        </Link>
                        <button
                          onClick={() => handleDelete(book.bookId)}
                          className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 text-xs font-bold rounded-lg transition-all flex items-center justify-center"
                          title="Remove from history"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-[var(--color-text)] mb-1">
                  Remove from History?
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  This will remove this book from your reading history. Your
                  reading progress will be lost.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-3 bg-[var(--color-bg-warm)] hover:bg-[var(--color-border-light)] text-[var(--color-text)] font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl"
              >
                Remove
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
