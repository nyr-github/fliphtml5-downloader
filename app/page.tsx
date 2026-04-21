import React from 'react';
import { BookOpen, LayoutGrid } from 'lucide-react';
import { motion } from 'framer-motion'; // Motion is client only, but we can't use it in server component file unless we use client components
import Link from 'next/link';
import FlipDownloaderClient from '@/components/FlipDownloaderClient';
import PopularBooksSection from '@/components/PopularBooksSection';

export const metadata = {
  title: 'FlipBook Downloader - High Quality PDF Conversion',
  description: 'Download FlipHTML5 publications as high-quality PDF files instantly.',
};

export default function FlipDownloader() {
  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans overflow-x-hidden" suppressHydrationWarning>
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" suppressHydrationWarning>
        <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[60%] bg-[#FF6B35]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[60%] h-[60%] bg-[#004E98]/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        <div className="mb-12">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-4" suppressHydrationWarning>Fast Conversion.</h2>
          <p className="text-gray-500 font-medium max-w-lg" suppressHydrationWarning>Retrieve any FlipHTML5 publication as a high-quality PDF in seconds. Optimized for stability and ease of use.</p>
        </div>

        {/* Popular Content Section */}
        <PopularBooksSection />

        {/* Client logic for downloader */}
        <React.Suspense fallback={<div className="p-3 md:p-4 bg-white/50 rounded-3xl min-h-[100px] animate-pulse" />}>
          <FlipDownloaderClient />
        </React.Suspense>

        <footer className="mt-20 pt-8 border-t border-gray-100/50 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-300">Fast PDF Conversion & High Integrity Retrieval</p>
        </footer>
      </div>
    </div>
  );
}
