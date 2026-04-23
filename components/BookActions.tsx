"use client";

import React from "react";
import Link from "next/link";
import { Download, Eye, Share2 } from "lucide-react";

interface BookActionsProps {
  id: string;
  id1: string;
  id2: string;
  title?: string;
  pageCount?: number;
}

export default function BookActions({
  id,
  id1,
  id2,
  title,
  pageCount,
}: BookActionsProps) {
  const bookUrl = `https://fliphtml5.com/${id1}/${id2}`;
  const downloadUrl = `/?url=${encodeURIComponent(bookUrl)}`;
  const [showCopied, setShowCopied] = React.useState(false);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: title ? `${title} - FlipHTML5 Book` : "FlipHTML5 Book",
      text: title
        ? `Check out "${title}" - ${pageCount} pages available to download and read online for free.`
        : "Check out this FlipHTML5 book available to download and read online for free.",
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Error sharing:", err);
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      } catch (err) {
        console.error("Error copying to clipboard:", err);
      }
    }
  };

  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-8 sm:mb-10">
      <Link
        href={`/read/${id}`}
        className="group px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white font-bold rounded-xl flex items-center justify-center gap-2 sm:gap-3 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all active:scale-95 text-sm sm:text-base"
      >
        <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
        <span>Read Online Now</span>
      </Link>
      <Link
        href={downloadUrl}
        className="group px-6 sm:px-8 py-3.5 sm:py-4 bg-white border-2 border-[var(--color-border)] text-[var(--color-text)] font-bold rounded-xl flex items-center justify-center gap-2 sm:gap-3 shadow-md hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:shadow-lg transition-all active:scale-95 text-sm sm:text-base"
      >
        <Download className="w-4 h-4 sm:w-5 sm:h-5" />
        <span>Download as PDF</span>
      </Link>
      <button
        onClick={handleShare}
        className="group px-6 sm:px-8 py-3.5 sm:py-4 bg-white border-2 border-[var(--color-border-light)] text-[var(--color-text)] font-bold rounded-xl flex items-center justify-center gap-2 sm:gap-3 shadow-sm hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:shadow-md transition-all active:scale-95 text-sm sm:text-base relative"
        title="Share this book"
      >
        <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
        <span>Share</span>
        {showCopied && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[var(--color-primary)] text-white text-xs font-medium rounded-lg shadow-lg whitespace-nowrap animate-in fade-in slide-in-from-bottom-2">
            Link copied!
          </div>
        )}
      </button>
    </div>
  );
}
