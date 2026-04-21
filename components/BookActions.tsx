'use client';

import React from 'react';
import Link from 'next/link';
import { Download, Eye } from 'lucide-react';

export default function BookActions({ id }: { id: string }) {
  const scrollToDownloader = () => {
    const el = document.getElementById('downloader-section');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-wrap gap-4 mb-10">
      <Link 
        href={`/read/${id}`}
        className="px-8 py-4 bg-[#FF6B35] text-white font-bold rounded-2xl flex items-center gap-3 shadow-lg shadow-[#FF6B35]/20 hover:shadow-xl hover:translate-y-[-2px] transition-all active:scale-95 group"
      >
        <Eye className="w-5 h-5" />
        <span>Read Online Now</span>
      </Link>
      <button 
        onClick={scrollToDownloader}
        className="px-8 py-4 bg-[#1A1A1A] text-white font-bold rounded-2xl flex items-center gap-3 shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all active:scale-95"
      >
        <Download className="w-5 h-5 text-[#FF6B35]" />
        <span>Prepare PDF Download</span>
      </button>
    </div>
  );
}
