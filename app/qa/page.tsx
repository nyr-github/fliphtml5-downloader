import React from "react";
import { qaData } from "@/qa";
import { Metadata } from "next";
import Accordion from "@/components/ui/Accordion";
import { HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Frequently Asked Questions - FlipHTML5 Downloader",
  description:
    "Find answers to common questions about FlipHTML5 Downloader. Learn how to download flipbooks as PDF, troubleshoot issues, and more.",
  keywords: [
    "FAQ",
    "frequently asked questions",
    "fliphtml5 help",
    "download guide",
    "flipbook converter help",
  ],
  openGraph: {
    title: "Frequently Asked Questions - FlipHTML5 Downloader",
    description:
      "Find answers to common questions about FlipHTML5 Downloader. Learn how to download flipbooks as PDF, troubleshoot issues, and more.",
    type: "website",
  },
};

export default function QAPage() {
  // FAQ Schema for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qaData.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      {/* FAQ Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-[var(--color-bg)] py-16 sm:py-20 px-4">
        {/* Background gradient mesh */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden gradient-mesh" />

        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 sm:mb-16">
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--color-text)] mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-base sm:text-lg text-[var(--color-text-secondary)] font-light max-w-2xl mx-auto">
              Everything you need to know about FlipHTML5 Downloader. Can&apos;t
              find what you&apos;re looking for? Join our Discord community.
            </p>
          </div>

          {/* Q&A List */}
          <div className="space-y-4">
            {qaData.map((item, index) => (
              <Accordion
                key={index}
                question={item.question}
                answer={item.answer}
              />
            ))}
          </div>

          {/* Discord CTA */}
          <div className="mt-12 sm:mt-16 text-center">
            <p className="text-sm sm:text-base text-[var(--color-text-secondary)] mb-4">
              Still have questions?
            </p>
            <a
              href="https://discord.gg/5EZ3u4pe"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Join Our Discord Community
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
