"use client";

import React from "react";
import Link from "next/link";
import { Download, Eye, Share2 } from "lucide-react";
import ShareModal from "@/components/ShareModal";

interface BookActionsProps {
  id: string;
  id1: string;
  id2: string;
  title?: string;
  pageCount?: number;
  /** 书本封面绝对 URL，用于 Pinterest 等支持在分享 URL 携带图片的渠道 */
  thumbnail?: string;
}

export default function BookActions({
  id,
  id1,
  id2,
  title,
  pageCount,
  thumbnail,
}: BookActionsProps) {
  const bookUrl = `https://fliphtml5.com/${id1}/${id2}`;
  const downloadUrl = `/?url=${encodeURIComponent(bookUrl)}`;
  const [shareOpen, setShareOpen] = React.useState(false);

  // 分享所需的链接：当前页面地址；服务端渲染阶段回退为可预测值
  const shareUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `${process.env.NEXT_PUBLIC_BASE_URL || ""}/book/${id}`;

  // 嵌入使用专用的 iframe 阅读页
  const embedUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/read/iframe/${id}`
      : `${process.env.NEXT_PUBLIC_BASE_URL || ""}/read/iframe/${id}`;

  const shareTitle = title
    ? `${title} - FlipHTML5 Book can be downloaded now`
    : "FlipHTML5 Book can be downloaded now";
  const shareDescription = title
    ? `Check out "${title}"${
        pageCount ? ` - ${pageCount} pages` : ""
      } available to download and read online for free.`
    : "Check out this FlipHTML5 book available to download and read online for free.";

  return (
    <>
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
          prefetch={false}
          className="group px-6 sm:px-8 py-3.5 sm:py-4 bg-white border-2 border-[var(--color-border)] text-[var(--color-text)] font-bold rounded-xl flex items-center justify-center gap-2 sm:gap-3 shadow-md hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:shadow-lg transition-all active:scale-95 text-sm sm:text-base"
        >
          <Download className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Download as PDF</span>
        </Link>
        <button
          onClick={() => setShareOpen(true)}
          className="group px-6 sm:px-8 py-3.5 sm:py-4 bg-white border-2 border-[var(--color-border-light)] text-[var(--color-text)] font-bold rounded-xl flex items-center justify-center gap-2 sm:gap-3 shadow-sm hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:shadow-md transition-all active:scale-95 text-sm sm:text-base relative"
          title="Share this book"
          type="button"
        >
          <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Share</span>
        </button>
      </div>

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        url={shareUrl}
        title={shareTitle}
        description={shareDescription}
        image={thumbnail}
        embedUrl={embedUrl}
        totalPages={pageCount}
      />
    </>
  );
}
