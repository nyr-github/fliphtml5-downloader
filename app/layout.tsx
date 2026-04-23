import type { Metadata, Viewport } from "next";
import "./globals.css"; // Global styles
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Analytics from "@/components/Analytics";

export const metadata: Metadata = {
  title: {
    default:
      "FlipHTML5 Downloader - Download Flipbook as PDF | FlipBook Converter",
    template: "%s | FlipHTML5 Downloader",
  },
  description:
    "Download FlipHTML5 flipbooks as high-quality PDF files instantly. Free online flipbook converter and reader. Extract, convert, and save your favorite flipbooks in seconds.",
  keywords: [
    "fliphtml5 downloader",
    "flipbook converter",
    "flipbook to pdf",
    "download flipbook",
    "fliphtml5 pdf converter",
    "online flipbook reader",
    "flipbook extractor",
  ],
  authors: [{ name: "FlipBook Downloader Team" }],
  creator: "FlipBook Downloader",
  publisher: "FlipBook Downloader",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://yourdomain.com",
    siteName: "FlipHTML5 Downloader",
    title: "FlipHTML5 Downloader - Convert Flipbooks to PDF",
    description:
      "Download FlipHTML5 flipbooks as high-quality PDF files instantly. Free online flipbook converter and reader.",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://yourdomain.com"}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "FlipHTML5 Downloader - Convert Flipbooks to PDF",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FlipHTML5 Downloader - Convert Flipbooks to PDF",
    description:
      "Download FlipHTML5 flipbooks as high-quality PDF files instantly. Free online flipbook converter and reader.",
    images: [
      `${process.env.NEXT_PUBLIC_BASE_URL || "https://yourdomain.com"}/og-image.jpg`,
    ],
    creator: "@flipbookdownloader",
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_BASE_URL || "https://yourdomain.com",
  },
  category: "Technology",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#e85d26",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="yandex-verification" content="e647953438a9f448" />
        <meta name="msvalidate.01" content="36F36D784E65ACD735FA9D567AF15F1D" />
      </head>
      <body
        suppressHydrationWarning
        className="bg-[var(--color-bg)] font-body antialiased flex flex-col min-h-screen"
      >
        <Navbar />
        <main className="pt-16 sm:pt-20 md:pt-24 flex-grow mobile-safe-bottom">
          {children}
        </main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
