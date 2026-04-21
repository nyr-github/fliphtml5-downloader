'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Maximize2, 
  Minimize2, 
  Loader2, 
  Download,
  Info
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { FlipPage, FlipConfig } from '@/lib/types';
import { decryptPages, loadScript } from '@/lib/decryption';

export default function BookReaderClient({ 
  dbId,
  id1, 
  id2, 
  title 
}: { 
  dbId: string;
  id1: string; 
  id2: string; 
  title: string;
}) {
  const [pages, setPages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const readerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadBookConfig() {
      try {
        const configUrl = `https://online.fliphtml5.com/${id1}/${id2}/javascript/config.js`;
        const res = await fetch(configUrl);
        const text = await res.text();
        
        // Extract json from the config.js file
        // Usually it's window.htmlConfig = {...};
        const jsonMatch = text.match(/window\.htmlConfig\s*=\s*({[\s\S]*?});/);
        if (!jsonMatch) throw new Error("Could not parse book configuration");
        
        const config: FlipConfig = JSON.parse(jsonMatch[1]);
        let pageData: FlipPage[] = [];
        
        if (typeof config.fliphtml5_pages === 'string') {
          pageData = await decryptPages(config.fliphtml5_pages);
        } else {
          pageData = config.fliphtml5_pages;
        }

        const urls = pageData.map(p => 
          `https://online.fliphtml5.com/${id1}/${id2}/files/large/${p.t}`
        );
        
        setPages(urls);
        setLoading(false);
      } catch (err) {
        console.error("Error loading reader config:", err);
        setLoading(false);
      }
    }

    loadBookConfig();
  }, [id1, id2]);

  const nextPage = useCallback(() => {
    if (currentIndex < pages.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, pages.length]);

  const prevPage = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextPage();
      if (e.key === 'ArrowLeft') prevPage();
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextPage, prevPage, isFullscreen]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      readerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#1A1A1A] flex flex-col items-center justify-center text-white z-[100]">
        <Loader2 className="w-12 h-12 text-[#FF6B35] animate-spin mb-4" />
        <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Loading Experience...</p>
      </div>
    );
  }

  // Preload next 3 pages
  const preloadIndices = Array.from({ length: 3 }, (_, i) => currentIndex + 1 + i)
    .filter(index => index < pages.length);

  return (
    <div 
      ref={readerRef}
      className={`fixed inset-0 bg-[#0A0A0A] flex flex-col z-[100] transition-all duration-500 ${isFullscreen ? 'p-0' : ''}`}
    >
      {/* Top Bar */}
      <div className="h-16 px-6 flex items-center justify-between bg-black/40 backdrop-blur-md border-b border-white/5 z-20">
        <div className="flex items-center gap-4">
          <Link 
            href={`/book/${dbId}`}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
          >
            <X className="w-6 h-6" />
          </Link>
          <div className="hidden md:block">
            <h2 className="text-white font-bold text-sm truncate max-w-[300px]">{title}</h2>
            <p className="text-[10px] text-white/40 uppercase font-black tracking-tighter">
              Page {currentIndex + 1} of {pages.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={toggleFullscreen}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-white"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <Link
            href={`/book/${dbId}`}
            className="px-6 py-2.5 bg-[#FF6B35] text-white text-xs font-black rounded-xl uppercase tracking-widest shadow-lg shadow-[#FF6B35]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            PDF Action
          </Link>
        </div>
      </div>

      {/* Main Reader Stage */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden p-4 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="relative h-full w-full max-w-5xl flex items-center justify-center group"
          >
            <div className="relative h-full w-full shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] rounded-sm overflow-hidden bg-white/5">
                <Image
                  src={pages[currentIndex]}
                  alt={`Page ${currentIndex + 1}`}
                  fill
                  className="object-contain"
                  referrerPolicy="no-referrer"
                  unoptimized // Faster for external high-res images
                  priority
                />
            </div>
            
            {/* Page Overlay Stats (Mobile Only) */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] text-white/70 font-bold md:hidden">
              {currentIndex + 1} / {pages.length}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Overlays */}
        <button 
          onClick={prevPage}
          disabled={currentIndex === 0}
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-4 bg-white/5 hover:bg-white/15 rounded-full text-white/50 hover:text-white disabled:opacity-0 transition-all z-10 backdrop-blur-sm border border-white/5"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        <button 
          onClick={nextPage}
          disabled={currentIndex === pages.length - 1}
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-4 bg-white/5 hover:bg-white/15 rounded-full text-white/50 hover:text-white disabled:opacity-0 transition-all z-10 backdrop-blur-sm border border-white/5"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>

      {/* Progress & Preload Area */}
      <div className="h-20 px-8 flex items-center gap-8 bg-black/40 backdrop-blur-md border-t border-white/5 z-20">
         <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden relative">
            <motion.div 
               className="absolute inset-y-0 left-0 bg-[#FF6B35] shadow-[0_0_10px_#FF6B35]"
               initial={false}
               animate={{ width: `${((currentIndex + 1) / pages.length) * 100}%` }}
               transition={{ duration: 0.4 }}
            />
         </div>
         
         <div className="hidden lg:flex items-center gap-4 overflow-x-auto no-scrollbar">
            {pages.slice(Math.max(0, currentIndex - 2), Math.min(pages.length, currentIndex + 3)).map((url, i) => {
               const idx = pages.indexOf(url);
               return (
                  <button 
                    key={url}
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative w-12 aspect-[3/4] rounded-md overflow-hidden transition-all duration-300 ${idx === currentIndex ? 'scale-110 ring-2 ring-[#FF6B35] z-10' : 'opacity-40 hover:opacity-100 scale-90'}`}
                  >
                    <Image src={url} alt="nav" fill className="object-cover" referrerPolicy="no-referrer" unoptimized />
                  </button>
               );
            })}
         </div>
      </div>

      {/* Hidden Preloading Div */}
      <div className="fixed opacity-0 pointer-events-none -z-50 overflow-hidden">
        {preloadIndices.map(idx => (
           <img key={idx} src={pages[idx]} referrerPolicy="no-referrer" alt="preload" />
        ))}
      </div>
    </div>
  );
}
