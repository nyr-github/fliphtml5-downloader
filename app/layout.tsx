import type {Metadata} from 'next';
import './globals.css'; // Global styles
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'FlipBook Downloader - High Quality PDF Conversion',
  description: 'Download FlipHTML5 publications as high-quality PDF files instantly.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="bg-[#FDFCFB]">
        <Navbar />
        <main className="pt-20 md:pt-24 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
