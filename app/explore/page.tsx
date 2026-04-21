import React from 'react';
import { getExploreBooks } from '@/lib/actions';
import { Book, Download, Eye, Layers } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'Explore Popular FlipBooks - FlipBook Downloader Square',
  description: 'Discover and download popular FlipHTML5 publications shared by our community.',
};

export default async function ExplorePage() {
  const books = await getExploreBooks();

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] py-8 px-4 md:py-12">
      <div className="max-w-7xl mx-auto">
        <header className="mb-16 text-center">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4" suppressHydrationWarning>Discovery Square</h1>
          <p className="text-gray-500 max-w-xl mx-auto font-medium" suppressHydrationWarning>
            Explore the most popular publications retrieved by our global community.
          </p>
        </header>

        {books.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
            <p className="text-gray-400 italic">No books have been shared yet. Be the first!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {books.map((book) => (
              <div key={book.id} className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 flex flex-col">
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                  <Image 
                    src={book.thumbnail.startsWith('http') ? book.thumbnail : `https://online.fliphtml5.com/${book.id1}/${book.id2}/${book.thumbnail.replace('./', '')}`}
                    alt={book.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                    <Link 
                      href={`/book/${book.id}`}
                      className="w-full py-3 bg-white text-black text-center font-bold rounded-xl active:scale-95 transition-transform shadow-xl"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg mb-3 line-clamp-2 leading-tight group-hover:text-[#FF6B35] transition-colors">{book.title}</h3>
                  <div className="mt-auto flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        {book.pageCount} Pages
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5" />
                        {book.downloadCount}
                      </span>
                    </div>
                    <span className="text-[#004E98]">Verified</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <footer className="mt-24 pt-12 border-t border-gray-100 text-center">
          <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">FlipBook Community Square</p>
        </footer>
      </div>
    </div>
  );
}
