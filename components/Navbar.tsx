"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  LayoutGrid,
  Download,
  Search,
  Menu,
  X,
  AppWindowIcon,
  MessageCircle,
  BookText,
  HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks: any[] = [
    {
      name: "Discord Community",
      href: "https://discord.gg/5EZ3u4pe",
      icon: MessageCircle,
    },
    {
      name: "Blog",
      href: "/blog",
      icon: BookText,
    },
    {
      name: "FlipHtml5",
      href: "https://fliphtml5.com/exploring/",
      icon: BookOpen,
    },
    {
      name: "FAQ",
      href: "/qa",
      icon: HelpCircle,
    },
    {
      name: "All Apps",
      href: "/all-apps",
      icon: AppWindowIcon,
    },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "py-2 sm:py-3 glass shadow-sm"
          : "py-4 sm:py-6 bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
          {/* <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div> */}
          <img
            src="/icon-512.png"
            alt="Fliphtml5 Downloader"
            className="w-9 h-9 sm:w-11 sm:h-11"
          />

          <div>
            <span className="font-display text-base sm:text-xl font-bold tracking-tight text-[var(--color-text)]">
              Fliphtml5
            </span>
            <span className="font-display text-base sm:text-xl font-light text-[var(--color-primary)] ml-1">
              Downloader
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? "text-[var(--color-primary)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-[var(--color-primary)]/5 rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <link.icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{link.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="lg:hidden p-2 sm:p-2.5 glass rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors flex items-center justify-center"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
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
              className="fixed inset-0 top-[60px] sm:top-[73px] bg-black/20 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="absolute top-[60px] sm:top-[73px] left-0 right-0 glass p-4 sm:p-6 z-50 md:hidden flex flex-col gap-3 shadow-xl"
            >
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-4 p-3 sm:p-4 rounded-xl text-sm sm:text-base font-semibold transition-colors ${
                      isActive
                        ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                        : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-warm)]"
                    }`}
                  >
                    <link.icon className="w-5 h-5" />
                    {link.name}
                  </Link>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
