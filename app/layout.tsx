import type { Metadata, Viewport } from "next";
import "./globals.css"; // Global styles
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Fliphtml5 Downloader - Premium PDF Conversion",
  description:
    "Download FlipHTML5 publications as high-quality PDF files instantly. Elegant, fast, and reliable.",
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
      <body
        suppressHydrationWarning
        className="bg-[var(--color-bg)] font-body antialiased"
      >
        <Navbar />
        <main className="pt-16 sm:pt-20 md:pt-24 min-h-screen mobile-safe-bottom">
          {children}
        </main>
      </body>
    </html>
  );
}
