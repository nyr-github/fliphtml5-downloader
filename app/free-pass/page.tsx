import { Metadata } from "next";
import TweetPassClient from "@/components/TweetPassClient";

export const metadata: Metadata = {
    title: "Earn a Free Pass - FlipHTML5 Downloader",
    description:
        "Follow @aivaded on X, post about FlipHTML5 Downloader, then submit your post link and email to get a free download pass code by email.",
    keywords: [
        "free fliphtml5 downloader",
        "free pass code",
        "flipbook download free",
        "earn free pass",
    ],
    openGraph: {
        title: "Earn a Free Pass - FlipHTML5 Downloader",
        description:
            "Follow @aivaded on X, share FlipHTML5 Downloader, and get a free download pass code by email.",
        type: "website",
    },
};

export default function FreePassPage() {
    return (
        <div className="min-h-screen bg-[var(--color-bg)] py-16 sm:py-20 px-4">
            <div className="fixed inset-0 pointer-events-none overflow-hidden gradient-mesh" />
            <div className="relative z-10 max-w-2xl mx-auto">
                <div className="text-center mb-10 sm:mb-12">
                    <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--color-text)] mb-4">
                        Earn a Free Pass
                    </h1>
                    <p className="text-base sm:text-lg text-[var(--color-text-secondary)] font-light max-w-xl mx-auto">
                        Love FlipHTML5 Downloader? Follow @aivaded on X, post about it,
                        then submit your link and email — we&apos;ll send your free pass
                        code.
                    </p>
                </div>
                <TweetPassClient />
            </div>
        </div>
    );
}
