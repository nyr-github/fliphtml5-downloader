'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, LayoutGrid, Download, Search, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Downloader', href: '/', icon: Download },
    { name: 'Discovery Square', href: '/explore', icon: LayoutGrid },
  ];

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'py-3 bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-100' : 'py-6 bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-[#1A1A1A] rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
            <BookOpen className="w-5 h-5 text-[#FF6B35]" />
          </div>
          <span className="font-black text-lg tracking-tight hidden sm:block">FlipBook <span className="text-[#FF6B35]">DL</span></span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1 bg-gray-100/50 p-1 rounded-2xl border border-gray-100/50">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isActive 
                    ? 'bg-white text-[#1A1A1A] shadow-sm' 
                    : 'text-gray-500 hover:text-[#1A1A1A] hover:bg-white/50'
                }`}
              >
                <link.icon className={`w-4 h-4 ${isActive ? 'text-[#FF6B35]' : ''}`} />
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Action Button (Desktop) */}
        <div className="hidden md:block" suppressHydrationWarning>
          <Link 
            href="/explore" 
            className="px-6 py-3 bg-[#1A1A1A] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#333] transition-colors active:scale-95 shadow-lg shadow-black/10"
          >
            Start Discovery
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden p-3 bg-white border border-gray-100 rounded-xl text-gray-600 shadow-sm"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 top-[73px] bg-black/20 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="absolute top-[73px] left-0 right-0 bg-white border-b border-gray-100 p-6 z-50 md:hidden flex flex-col gap-4 shadow-xl"
            >
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link 
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-4 p-4 rounded-2xl text-base font-bold ${
                      isActive ? 'bg-[#FF6B35]/10 text-[#FF6B35]' : 'bg-gray-50 text-gray-600'
                    }`}
                  >
                    <link.icon className="w-5 h-5" />
                    {link.name}
                  </Link>
                );
              })}
              <Link 
                href="/explore" 
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-4 mt-2 bg-[#1A1A1A] text-white text-center rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl"
              >
                Explore Community
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
