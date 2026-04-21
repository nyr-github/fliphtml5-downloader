import React from 'react';
import { getExploreBooks } from '@/lib/actions';
import Image from 'next/image';
import Link from 'next/link';
import { Download, LayoutGrid, Sparkles } from 'lucide-react';

export default async function PopularBooksSection() {
  const books = (await getExploreBooks()).slice(0, 4);

  if (books.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#FF6B35]/10 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#FF6B35]" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Popular in Square</h2>
        </div>
        <Link 
          href="/explore" 
          className="text-sm font-bold text-[#004E98] hover:underline flex items-center gap-1"
        >
          View All Discovery 
          <LayoutGrid className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {books.map((book) => (
          <Link 
            key={book.id} 
            href={`/book/${book.id}`}
            className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100 transition-all hover:shadow-md active:scale-[0.98]"
          >
            <Image
              src={book.thumbnail.startsWith('http') ? book.thumbnail : `https://online.fliphtml5.com/${book.id1}/${book.id2}/${book.thumbnail.replace('./', '')}`}
              alt={book.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
              <p className="text-white text-[10px] font-bold uppercase truncate mb-1" suppressHydrationWarning>{book.title}</p>
              <div className="flex items-center gap-2 text-[9px] text-white/70 font-bold uppercase">
                <span className="flex items-center gap-1">
                  <Download className="w-2.5 h-2.5" />
                  {book.downloadCount}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
