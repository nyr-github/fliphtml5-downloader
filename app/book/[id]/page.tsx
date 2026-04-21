import React from 'react';
import { getBookById } from '@/lib/actions';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, ChevronLeft, Download, Layers, ShieldCheck, Sparkles } from 'lucide-react';
import FlipDownloaderClient from '@/components/FlipDownloaderClient';
import BookActions from '@/components/BookActions';

export default async function BookDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await getBookById(id);

  if (!book) {
    notFound();
  }

  const bookUrl = `https://fliphtml5.com/${book.id1}/${book.id2}`;
  const thumbnailFull = book.thumbnail.startsWith('http') 
    ? book.thumbnail 
    : `https://online.fliphtml5.com/${book.id1}/${book.id2}/${book.thumbnail.replace('./', '')}`;

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans pb-20 overflow-x-hidden" suppressHydrationWarning>
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" suppressHydrationWarning>
        <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[60%] bg-[#FF6B35]/3 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[60%] h-[60%] bg-[#004E98]/3 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 pt-12 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
          {/* Left: Book Cover preview */}
          <div className="md:col-span-4 flex flex-col gap-6">
            <div className="relative aspect-[3/4] rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white transform transition-transform hover:scale-[1.02] duration-500">
              <Image
                src={thumbnailFull}
                alt={book.title}
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
                priority
              />
              <div className="absolute top-4 right-4 animate-pulse">
                <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter text-[#FF6B35] flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-3 h-3" />
                  Popular
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase font-bold text-gray-400 mb-1">Total Pages</span>
                <span className="text-lg font-black text-[#1A1A1A] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#004E98]" />
                  {book.pageCount}
                </span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase font-bold text-gray-400 mb-1">Downloads</span>
                <span className="text-lg font-black text-[#1A1A1A] flex items-center gap-2">
                  <Download className="w-4 h-4 text-[#FF6B35]" />
                  {book.downloadCount}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Info and Action */}
          <div className="md:col-span-8 flex flex-col">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-[#004E98]/10 text-[#004E98] text-[10px] font-bold rounded-full uppercase tracking-widest">FlipHTML5 Retrieval</span>
                <div className="flex items-center gap-1 text-green-600 font-bold text-[10px] uppercase">
                  <ShieldCheck className="w-3 h-3" />
                  Source Verified
                </div>
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.1] mb-6" suppressHydrationWarning>
                {book.title}
              </h1>
              <p className="text-gray-500 leading-relaxed max-w-3xl mb-8" suppressHydrationWarning>
                This publication has been indexed by our community. You can now process it for high-quality PDF conversion or read it directly using our optimized web reader.
              </p>
              
              <BookActions id={id} />
            </div>

            <div id="downloader-section" className="bg-gray-50/50 rounded-3xl p-6 border border-gray-100 mb-12">
               <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                 <BookOpen className="w-4 h-4" />
                 PDF Generator
               </h3>
               {/* Use the shared downloader component pre-filled with this book's URL */}
               <React.Suspense fallback={<div className="h-40 bg-white rounded-3xl animate-pulse" />}>
                 <FlipDownloaderClient initialUrl={bookUrl} autoStart={false} />
               </React.Suspense>
            </div>
            
            <div className="mt-auto">
              <p className="text-[10px] text-gray-400 font-medium leading-relaxed" suppressHydrationWarning>
                Retrieved: {new Date().toLocaleDateString()}<br />
                Book Source: {bookUrl}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
