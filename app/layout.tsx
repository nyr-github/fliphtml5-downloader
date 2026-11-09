import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlipHTML5 to PDF - Local Edition",
  description: "A browser-only converter with no backend or database.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
