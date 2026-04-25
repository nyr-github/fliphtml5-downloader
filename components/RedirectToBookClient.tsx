"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBookConfig } from "@/hooks/useBookConfig";
import { Loader2 } from "lucide-react";

export default function RedirectToBookClient({
  id1,
  id2,
  title,
  bookId,
}: {
  id1: string;
  id2: string;
  title: string;
  bookId: string;
}) {
  const router = useRouter();
  const { config, loading, error } = useBookConfig(id1, id2);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    if (config && !adding) {
      handleAddBook();
    }
  }, [config]);

  const handleAddBook = async () => {
    if (!config || adding) return;

    setAdding(true);
    setAddError(null);

    try {
      // 调用 API 添加书籍到数据库
      const response = await fetch("/api/books/record", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id1,
          id2,
          title: config.title || title,
          thumbnail: config.thumbnail || "",
          pageCount: config.pageCount,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add book to database");
      }

      // 添加成功后跳转到书籍详情页
      router.push(`/book/${bookId}`);
      router.refresh();
    } catch (err) {
      console.error("Error adding book:", err);
      setAddError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setAdding(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Failed to Load Book
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (addError) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Error Adding Book
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-6">{addError}</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
      <div className="text-center p-8">
        <Loader2 className="w-12 h-12 animate-spin text-[var(--color-primary)] mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-[var(--color-text)] mb-2">
          {loading
            ? "Loading Book Configuration..."
            : "Adding Book to Library..."}
        </h2>
        <p className="text-[var(--color-text-secondary)] text-sm">
          Please wait while we prepare the book for you
        </p>
      </div>
    </div>
  );
}
