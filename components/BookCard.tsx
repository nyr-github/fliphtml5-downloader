import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Download, Eye, Layers } from "lucide-react";

interface Book {
  id: string;
  id1: string;
  id2: string;
  title: string;
  thumbnail: string;
  pageCount: number;
  downloadCount: number;
  createdAt?: Date;
}

interface BookCardProps {
  book: Book;
  index?: number;
  variant?: "grid" | "compact";
}

export default function BookCard({
  book,
  index,
  variant = "grid",
}: BookCardProps) {
  const thumbnailUrl = book.thumbnail.startsWith("http")
    ? book.thumbnail
    : `https://online.fliphtml5.com/${book.id1}/${book.id2}/${book.thumbnail.replace("./", "")}`;

  if (variant === "compact") {
    return (
      <Link
        href={`/book/${book.id}`}
        className="group relative aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden bg-white shadow-md border border-[var(--color-border-light)] hover-lift"
      >
        <Image
          src={thumbnailUrl}
          alt={book.title}
          fill
          unoptimized={true}
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 sm:p-5 flex flex-col justify-end">
          <p className="text-white text-[10px] sm:text-xs font-bold uppercase truncate mb-2 font-display">
            {book.title}
          </p>
          <div className="flex items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] text-white/80 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Download className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              {book.downloadCount} downloads
            </span>
          </div>
        </div>
        {index !== undefined && (
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 w-6 h-6 sm:w-7 sm:h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[9px] sm:text-[10px] font-bold text-[var(--color-primary)]">
              #{index + 1}
            </span>
          </div>
        )}
      </Link>
    );
  }

  // Grid variant (for Explore page)
  return (
    <Link
      href={`/book/${book.id}`}
      className="group bg-white rounded-xl  overflow-hidden shadow-md hover:shadow-xl transition-all border border-[var(--color-border-light)] flex flex-col hover-lift"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[var(--color-bg-warm)]">
        <Image
          src={thumbnailUrl}
          alt={book.title}
          fill
          unoptimized={true}
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        {index !== undefined && (
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-7 h-7 sm:w-8 sm:h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] sm:text-xs font-bold text-[var(--color-primary)]">
              #{index + 1}
            </span>
          </div>
        )}
      </div>
      <div className="p-2 sm:p-4 flex-1 flex flex-col">
        <h3 className="font-display font-bold text-sm  mb-2 sm:mb-3 line-clamp-2 leading-tight group-hover:text-[var(--color-primary)] transition-colors">
          {book.title}
        </h3>
        <div className="mt-auto flex items-center justify-between text-[10px] sm:text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              {book.pageCount}
            </span>
            <span className="flex items-center gap-1.5">
              <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              {book.downloadCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
