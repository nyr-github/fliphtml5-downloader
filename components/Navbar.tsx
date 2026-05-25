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
  Clock,
  ChevronDown,
  Calendar,
  Tag,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { BOOK_TAGS, tagToSlug } from "@/lib/constants";

export default function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resourcesDropdownOpen, setResourcesDropdownOpen] = useState(false);
  const [pdfToolsDropdownOpen, setPdfToolsDropdownOpen] = useState(false);
  const [pdfApiDropdownOpen, setPdfApiDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks: any[] = [
    {
      name: "Reading History",
      href: "/history",
      icon: Clock,
    },
    {
      name: "All Apps",
      href: "/all-apps",
      icon: AppWindowIcon,
    },
  ];

  const browseTagsLinks = BOOK_TAGS.map((tag) => ({
    name: tag,
    href: `/books/${tagToSlug(tag)}`,
    icon: Tag,
  }));

  const pdfToolsLinks = [
    {
      name: "AI-Powered Invoice Parser",
      href: "https://pdf.co/products/ai-invoice-parser?via=aivaded",
      icon: FileText,
      external: true,
    },
    {
      name: "PDF to Anything",
      href: "https://pdf.co/products/pdf-extractor-api?via=aivaded",
      icon: FileText,
      external: true,
    },
    {
      name: "Edit PDF",
      href: "https://pdf.co/products/pdf-editor-api?via=aivaded",
      icon: FileText,
      external: true,
    },
    {
      name: "Fill PDF Forms",
      href: "https://pdf.co/products/pdf-form-filler-api?via=aivaded",
      icon: FileText,
      external: true,
    },
    {
      name: "Merge PDF",
      href: "https://pdf.co/products/pdf-merger-api?via=aivaded",
      icon: FileText,
      external: true,
    },
    {
      name: "Split PDF",
      href: "https://pdf.co/products/pdf-splitter-api?via=aivaded",
      icon: FileText,
      external: true,
    },
    {
      name: "PDF Repair",
      href: "https://lightpdfcom.pxf.io/QYnLm3",
      icon: FileText,
      external: true,
    },
    {
      name: "PDF Protect",
      href: "https://lightpdfcom.pxf.io/jRy0o0",
      icon: FileText,
      external: true,
    },
  ];

  const pdfApiLinks = [
    {
      name: "ChatPDF API",
      href: "https://lightpdfcom.pxf.io/k4MEBd",
      icon: FileText,
      external: true,
    },
    {
      name: "OCR API",
      href: "https://lightpdfcom.pxf.io/GbVJzL",
      icon: FileText,
      external: true,
    },
    {
      name: "Watermark Remove API",
      href: "https://lightpdfcom.pxf.io/VOY9qE",
      icon: FileText,
      external: true,
    },
  ];

  const resourceLinks = [
    {
      name: "Leave a Comment on X",
      href: "https://x.com/aivaded/status/2046677803987517552",
      icon: MessageCircle,
      external: true,
    },
    {
      name: "Join Discord Community",
      href: "https://discord.gg/5EZ3u4pe",
      icon: MessageCircle,
      external: true,
    },
    {
      name: "Browse by Date",
      href: "/books/date",
      icon: Calendar,
    },
    {
      name: "Browse by Tag",
      href: "/books",
      icon: Tag,
    },
    {
      name: "Blog",
      href: "/blog",
      icon: BookText,
    },
    {
      name: "FAQ",
      href: "/qa",
      icon: HelpCircle,
    },
    {
      name: "FlipHtml5",
      href: "https://fliphtml5.com/exploring/",
      icon: BookOpen,
      external: true,
    },
  ];

  const closeAllDropdowns = () => {
    setResourcesDropdownOpen(false);
    setPdfToolsDropdownOpen(false);
    setPdfApiDropdownOpen(false);
  };

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
          {/* PDF Tools Dropdown */}
          <div
            className="relative"
            onMouseLeave={() => setPdfToolsDropdownOpen(false)}
          >
            <button
              onClick={() => {
                setPdfToolsDropdownOpen(!pdfToolsDropdownOpen);
                setResourcesDropdownOpen(false);
                setPdfApiDropdownOpen(false);
              }}
              onMouseEnter={() => {
                setPdfToolsDropdownOpen(true);
                setResourcesDropdownOpen(false);
                setPdfApiDropdownOpen(false);
              }}
              className={`relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 text-[var(--color-text-secondary)] hover:text-[var(--color-text)]`}
            >
              <FileText className="w-4 h-4 relative z-10" />
              <span className="relative z-10">PDF Tools</span>
              <ChevronDown
                className={`w-3 h-3 relative z-10 transition-transform duration-200 ${
                  pdfToolsDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {pdfToolsDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  onMouseEnter={() => setPdfToolsDropdownOpen(true)}
                  onMouseLeave={() => setPdfToolsDropdownOpen(false)}
                  className="absolute top-full left-0 mt-2 w-64 glass rounded-xl shadow-xl overflow-hidden z-50"
                >
                  {pdfToolsLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={closeAllDropdowns}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-primary)]/5 transition-colors"
                    >
                      <link.icon className="w-4 h-4" />
                      {link.name}
                    </a>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* PDF API Dropdown */}
          <div
            className="relative"
            onMouseLeave={() => setPdfApiDropdownOpen(false)}
          >
            <button
              onClick={() => {
                setPdfApiDropdownOpen(!pdfApiDropdownOpen);
                setResourcesDropdownOpen(false);
                setPdfToolsDropdownOpen(false);
              }}
              onMouseEnter={() => {
                setPdfApiDropdownOpen(true);
                setResourcesDropdownOpen(false);
                setPdfToolsDropdownOpen(false);
              }}
              className={`relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 text-[var(--color-text-secondary)] hover:text-[var(--color-text)]`}
            >
              <FileText className="w-4 h-4 relative z-10" />
              <span className="relative z-10">PDF API</span>
              <ChevronDown
                className={`w-3 h-3 relative z-10 transition-transform duration-200 ${
                  pdfApiDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {pdfApiDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  onMouseEnter={() => setPdfApiDropdownOpen(true)}
                  onMouseLeave={() => setPdfApiDropdownOpen(false)}
                  className="absolute top-full left-0 mt-2 w-64 glass rounded-xl shadow-xl overflow-hidden z-50"
                >
                  {pdfApiLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={closeAllDropdowns}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-primary)]/5 transition-colors"
                    >
                      <link.icon className="w-4 h-4" />
                      {link.name}
                    </a>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Resources Dropdown */}
          <div
            className="relative"
            onMouseLeave={() => setResourcesDropdownOpen(false)}
          >
            <button
              onClick={() => {
                setResourcesDropdownOpen(!resourcesDropdownOpen);
                setPdfToolsDropdownOpen(false);
                setPdfApiDropdownOpen(false);
              }}
              onMouseEnter={() => {
                setResourcesDropdownOpen(true);
                setPdfToolsDropdownOpen(false);
                setPdfApiDropdownOpen(false);
              }}
              className={`relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 text-[var(--color-text-secondary)] hover:text-[var(--color-text)]`}
            >
              <BookOpen className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Resources</span>
              <ChevronDown
                className={`w-3 h-3 relative z-10 transition-transform duration-200 ${
                  resourcesDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {resourcesDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  onMouseEnter={() => setResourcesDropdownOpen(true)}
                  onMouseLeave={() => setResourcesDropdownOpen(false)}
                  className="absolute top-full left-0 mt-2 w-56 glass rounded-xl shadow-xl overflow-hidden z-50"
                >
                  {resourceLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        prefetch={false}
                        target={link.external ? "_blank" : "_self"}
                        rel={link.external ? "noopener noreferrer" : undefined}
                        onClick={closeAllDropdowns}
                        className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors ${
                          isActive
                            ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                            : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-primary)]/5"
                        }`}
                      >
                        <link.icon className="w-4 h-4" />
                        {link.name}
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                target={link.href.startsWith("https://") ? "_blank" : "_self"}
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
              className="fixed inset-0 top-[60px] sm:top-[73px] bg-black/20 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="absolute top-[60px] sm:top-[73px] left-0 right-0 glass p-4 sm:p-6 z-50 lg:hidden flex flex-col gap-3 shadow-xl max-h-[calc(100vh-80px)] overflow-y-auto"
            >
              {/* Mobile Community Links */}
              <div className="px-2 py-1">
                <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
                  Community
                </p>
                <a
                  href="https://x.com/aivaded/status/2046677803987517552"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-4 p-3 sm:p-4 rounded-xl text-sm sm:text-base font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-warm)] transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  Leave a Comment on X
                </a>
                <a
                  href="https://discord.gg/5EZ3u4pe"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-4 p-3 sm:p-4 rounded-xl text-sm sm:text-base font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-warm)] transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  Join Discord Community
                </a>
              </div>

              {/* Mobile Browse Links */}
              <div className="px-2 py-1">
                <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
                  Browse by Tag
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {browseTagsLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2 p-2.5 sm:p-3 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                          isActive
                            ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                            : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-warm)]"
                        }`}
                      >
                        <link.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="truncate">{link.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Mobile PDF Tools Links */}
              <div className="px-2 py-1">
                <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
                  PDF Tools
                </p>
                {pdfToolsLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-4 p-3 sm:p-4 rounded-xl text-sm sm:text-base font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-warm)] transition-colors"
                  >
                    <link.icon className="w-5 h-5" />
                    {link.name}
                  </a>
                ))}
              </div>

              {/* Mobile PDF API Links */}
              <div className="px-2 py-1">
                <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
                  PDF API
                </p>
                {pdfApiLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-4 p-3 sm:p-4 rounded-xl text-sm sm:text-base font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-warm)] transition-colors"
                  >
                    <link.icon className="w-5 h-5" />
                    {link.name}
                  </a>
                ))}
              </div>

              {/* Mobile Resources Links */}
              <div className="px-2 py-1">
                <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
                  Resources
                </p>
                {resourceLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      target={link.external ? "_blank" : "_self"}
                      rel={link.external ? "noopener noreferrer" : undefined}
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
              </div>

              {/* Mobile Nav Links */}
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    target={
                      link.href.startsWith("https://") ? "_blank" : "_self"
                    }
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
