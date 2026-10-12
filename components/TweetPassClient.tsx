"use client";

import React, { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, Loader2, Send, Shuffle, Twitter } from "lucide-react";
import { toast } from "sonner";
import { SITE_URL, X_PROFILE_URL } from "@/lib/constants";

// 系统内置的 100 条分享文案：前端随机展示其中一条，用户可编辑后再一键分享到 X。
// 每条均包含站点链接，满足「帖子必须包含网站链接 + 介绍」的硬性要求。
// 语气偏口语化，用第一人称讲使用经历和踩过的坑，避免看起来像广告通稿。
// 每条均完整出现品牌词组 "FlipHTML5 Downloader"，便于分享帖被搜到时定位到产品。
const TWEET_TEMPLATES = [
    `Honestly I was tired of screenshotting flipbook pages like an idiot. FlipHTML5 Downloader just spits out a clean PDF, free: ${SITE_URL}`,
    `Took me 3 failed tools and one sketchy extension before FlipHTML5 Downloader actually worked, and it wants no card: ${SITE_URL}`,
    `My laptop died mid-read last week and I lost a whole reference book. Now everything goes through FlipHTML5 Downloader first: ${SITE_URL}`,
    `Paid tools wanted $20/mo for something I do twice a year. FlipHTML5 Downloader is free and does the same job: ${SITE_URL}`,
    `Warning from personal pain: half the "free" flipbook tools online are watermark generators. FlipHTML5 Downloader isn't one: ${SITE_URL}`,
    `I kept losing bookmarks to books that later went private. FlipHTML5 Downloader is my archive button now: ${SITE_URL}`,
    `Reading magazines online had one flaw: no offline copy. FlipHTML5 Downloader fixed that in under a minute: ${SITE_URL}`,
    `My commute has zero signal. Dumping my reading list through FlipHTML5 Downloader sorted that problem: ${SITE_URL}`,
    `Was this close to paying a subscription to save one catalog. FlipHTML5 Downloader did it free, no signup: ${SITE_URL}`,
    `If you've ever rage-quit a download stuck at 90%, FlipHTML5 Downloader will feel suspiciously normal: it just finishes: ${SITE_URL}`,
    `Student here. Six textbook access codes I can't afford, so FlipHTML5 Downloader is how I keep the ones I need: ${SITE_URL}`,
    `Spent a whole evening retyping flipbook pages into Word for a report. FlipHTML5 Downloader does that in 5 minutes: ${SITE_URL}`,
    `Tried 4 Chrome extensions for FlipHTML5 books. Two were sketchy, one broke. FlipHTML5 Downloader needs no install: ${SITE_URL}`,
    `Confession: I once screenshotted 120 pages of a book. 120. FlipHTML5 Downloader would've done it in one click: ${SITE_URL}`,
    `Nobody warns you that flipbook links rot. FlipHTML5 Downloader is my no-exceptions archive step now: ${SITE_URL}`,
    `I was saving books one by one like a savage until I found the batch option in FlipHTML5 Downloader: ${SITE_URL}`,
    `My printer gives worse copies than FlipHTML5 Downloader does. Free, no signup, paste URL and go: ${SITE_URL}`,
    `Lost a project reference when a site redesigned. Now every book gets a FlipHTML5 Downloader PDF the same day: ${SITE_URL}`,
    `Didn't expect a free tool to give HD pages. Zoomed to 400% in the FlipHTML5 Downloader PDF, nothing pixelated: ${SITE_URL}`,
    `Every other tool made me install something. FlipHTML5 Downloader runs in the browser and that's why I stayed: ${SITE_URL}`,
    `Struggled a week with a scan-heavy book before finding FlipHTML5 Downloader. Quality beat my own attempts badly: ${SITE_URL}`,
    `My phone browser kept crashing on flipbooks. Reading the FlipHTML5 Downloader PDF instead is just calmer: ${SITE_URL}`,
    `Kept telling clients "I can't save this for you" until FlipHTML5 Downloader proved me wrong in one click: ${SITE_URL}`,
    `Wasted real money on "premium" converters. FlipHTML5 Downloader is free and does the same job plus more: ${SITE_URL}`,
    `I avoid tools that demand my email before a download. FlipHTML5 Downloader doesn't, which is rare these days: ${SITE_URL}`,
    `A flipbook I needed for research vanished overnight. Rebuilding my whole reading list with FlipHTML5 Downloader: ${SITE_URL}`,
    `Hated that my reading progress reset when I closed the tab. FlipHTML5 Downloader makes that irrelevant: ${SITE_URL}`,
    `First tool I tried gave me a corrupted file. Third try with FlipHTML5 Downloader opened clean on the first go: ${SITE_URL}`,
    `Long story short, I gave up on browser printing after it mangled every layout. FlipHTML5 Downloader keeps pages intact: ${SITE_URL}`,
    `Free and no pop-up ads every 5 seconds. FlipHTML5 Downloader earns a bookmark on that alone: ${SITE_URL}`,
    `I save flipbooks so I can annotate them, and highlighting in a web viewer was a nightmare. FlipHTML5 Downloader solved it: ${SITE_URL}`,
    `Traveling with paper catalogs was wrecking my bag. One PDF folder from FlipHTML5 Downloader on my tablet now: ${SITE_URL}`,
    `Annoyed I didn't know FlipHTML5 Downloader existed last semester. Half my notes could've been 3 hours shorter: ${SITE_URL}`,
    `My rule now: if it's online, FlipHTML5 Downloader turns it into a PDF the same day. Sites die, disks don't: ${SITE_URL}`,
    `Spent 40 minutes on a "free" tool that turned out to be a 3-page trial. FlipHTML5 Downloader has no such trick: ${SITE_URL}`,
    `Painful lesson: screenshots of a book are useless for search. FlipHTML5 Downloader gives me searchable PDFs: ${SITE_URL}`,
    `Was scared to paste a URL into some random site. FlipHTML5 Downloader asks no account and no data, just downloads: ${SITE_URL}`,
    `Constantly had to show flipbooks offline in meetings. FlipHTML5 Downloader means I never rely on hotel wifi: ${SITE_URL}`,
    `The one-click download felt too simple after fighting tools for months. Anyway, FlipHTML5 Downloader is free: ${SITE_URL}`,
    `I tore up over a missing 12-page section from another tool. FlipHTML5 Downloader grabbed every single page: ${SITE_URL}`,
    `Told my team to cancel their paid flipbook saving tool. FlipHTML5 Downloader replaced it and nobody complained: ${SITE_URL}`,
    `My biggest gripe with these sites was fake download buttons everywhere. FlipHTML5 Downloader is one box and a result: ${SITE_URL}`,
    `Spent a whole night retrying one broken book before realizing my tool was the problem. FlipHTML5 Downloader handled it: ${SITE_URL}`,
    `I'm not technical. Everything else needed settings I didn't get. FlipHTML5 Downloader just works: ${SITE_URL}`,
    `Needed 30 magazine issues for a project and felt dread. FlipHTML5 Downloader did them one after another, zero fuss: ${SITE_URL}`,
    `Flipbook viewers make terrible printing. Running it through FlipHTML5 Downloader to PDF first is my habit now: ${SITE_URL}`,
    `Another tool's free tier capped me at 10 pages. FlipHTML5 Downloader gave me the whole book: ${SITE_URL}`,
    `After losing a nearly-done thesis chapter to a dead link I became a chronic downloader. FlipHTML5 Downloader is the tool: ${SITE_URL}`,
    `Didn't trust the first result, so I checked all 80 pages. FlipHTML5 Downloader: clean, in order, nothing skipped: ${SITE_URL}`,
    `Bugs me that something this useful hid on page 4 of Google. Found FlipHTML5 Downloader by accident: ${SITE_URL}`,
    `My tablet is only good for PDFs now, and FlipHTML5 Downloader is what feeds it: ${SITE_URL}`,
    `Slow flight, zero wifi, and my FlipHTML5 Downloader folder saved the whole trip: ${SITE_URL}`,
    `Tried a paid one first; the refund took 3 weeks. FlipHTML5 Downloader free was the move I should've made: ${SITE_URL}`,
    `I keep one folder per topic of saved books. FlipHTML5 Downloader basically fixed my desktop mess too: ${SITE_URL}`,
    `Finding the right URL format was always the annoying part. FlipHTML5 Downloader takes the page URL and figures it out: ${SITE_URL}`,
    `Used a friend's "recommended" tool and ended up with 5 ad tabs. FlipHTML5 Downloader got theirs uninstalled: ${SITE_URL}`,
    `My research notes were trapped inside a flipbook I couldn't save. FlipHTML5 Downloader unstuck it for free: ${SITE_URL}`,
    `Honest review: I waited for the catch. Login, trial, watermark. FlipHTML5 Downloader never gave me one: ${SITE_URL}`,
    `Lost count of how many blank pages browser "Save as PDF" gave me. FlipHTML5 Downloader doesn't do that: ${SITE_URL}`,
    `Compared FlipHTML5 Downloader to a $50/yr tool I used to pay for. Same output, so that was embarrassing: ${SITE_URL}`,
    `My mom asked how to keep a picture book on her tablet. FlipHTML5 Downloader, one minute, instant wizard son: ${SITE_URL}`,
    `The catch with free tools is usually speed. FlipHTML5 Downloader finished a 200-page book while I made tea: ${SITE_URL}`,
    `After one too many "no longer available" screens, FlipHTML5 Downloader is step one of my reading now: ${SITE_URL}`,
    `Kept needing excerpts for slides. FlipHTML5 Downloader plus a page cut beats screenshotting every time: ${SITE_URL}`,
    `Two corrupted files in a row from another site. Third try with FlipHTML5 Downloader worked and I'm still suspicious: ${SITE_URL}`,
    `FlipHTML5 books are great until you need them offline. FlipHTML5 Downloader is my fix for that exact "until": ${SITE_URL}`,
    `No exaggeration: presenter wifi died and the FlipHTML5 Downloader PDF on my laptop saved the talk: ${SITE_URL}`,
    `Wasted an afternoon scrolling a forum about saving flipbooks. The answer was FlipHTML5 Downloader all along: ${SITE_URL}`,
    `My issue was files with no table of contents. FlipHTML5 Downloader keeps the structure so I can navigate: ${SITE_URL}`,
    `Been burned by tools that go free then paid. Keeping FlipHTML5 Downloader bookmarked and holding them to it: ${SITE_URL}`,
    `FlipHTML5 Downloader beat the browser extension I actually paid for. Still slightly bitter about that: ${SITE_URL}`,
    `Couldn't find a download button on the site hosting my book. Went looking and found FlipHTML5 Downloader: ${SITE_URL}`,
    `My desk is buried in printed catalogs because I had no digital copy. FlipHTML5 Downloader ended that era: ${SITE_URL}`,
    `Huge files used to be unmanageable. FlipHTML5 Downloader output lands small enough to actually email someone: ${SITE_URL}`,
    `Quality and file size never went together for me. FlipHTML5 Downloader surprised me on both: ${SITE_URL}`,
    `Lost real work to a browser crash. Now FlipHTML5 Downloader gets the file before I read a single page: ${SITE_URL}`,
    `I only needed one chapter and every tool wanted money for the whole book. FlipHTML5 Downloader is free either way: ${SITE_URL}`,
    `Explained flipbook saving to a coworker twice this week. Sent the FlipHTML5 Downloader link, questions stopped: ${SITE_URL}`,
    `Searching a PDF is basic, yet no flipbook viewer let me do it. FlipHTML5 Downloader fixed that in one go: ${SITE_URL}`,
    `My phone storage was full of blurry book screenshots. FlipHTML5 Downloader replaced them with clean PDFs: ${SITE_URL}`,
    `Reason I trust FlipHTML5 Downloader: I forgot about it after one use and it still worked the next time: ${SITE_URL}`,
    `The one time I paid for a tool I got 3 pages of the book. FlipHTML5 Downloader gave me all 90: ${SITE_URL}`,
    `A coworker swore "you can't save those". FlipHTML5 Downloader and 40 books later, we disagree: ${SITE_URL}`,
    `Long flipbooks hurt my eyes on screen. FlipHTML5 Downloader copies read fine in a PDF app at night: ${SITE_URL}`,
    `My problem wasn't downloading, it was page order. FlipHTML5 Downloader files come out sorted: ${SITE_URL}`,
    `Struggled with a book full of big image spreads. Other tools split them badly, FlipHTML5 Downloader didn't: ${SITE_URL}`,
    `People keep asking where my offline library came from. Same answer every time: FlipHTML5 Downloader, free: ${SITE_URL}`,
    `Turns out my "slow internet" was a bad tool. FlipHTML5 Downloader gave me the same file way faster: ${SITE_URL}`,
    `Deadline, broken flipbook viewer, no plan B. FlipHTML5 Downloader got me there with 20 minutes to spare: ${SITE_URL}`,
    `I'm wary pasting private book links anywhere. FlipHTML5 Downloader asks no login, so it's higher on my trust list: ${SITE_URL}`,
    `Last tool I tried stamped a giant logo across every page. FlipHTML5 Downloader output was a relief: ${SITE_URL}`,
    `Reading on the train meant losing my place constantly. FlipHTML5 Downloader once, annotate forever: ${SITE_URL}`,
    `My whole bookcase as one PDF folder via FlipHTML5 Downloader. Took longer to read than to make: ${SITE_URL}`,
    `I nearly retyped a table out of a flipbook by hand. Caught myself and used FlipHTML5 Downloader instead: ${SITE_URL}`,
    `FlipHTML5 Downloader does what I need with no onboarding tour, which I appreciate more than it sounds: ${SITE_URL}`,
    `After three years of paying for tools that got worse each update, I keep free ones only. FlipHTML5 Downloader is one: ${SITE_URL}`,
    `Email verification before a download annoyed me for years. FlipHTML5 Downloader never asks for that: ${SITE_URL}`,
    `My teacher said screenshots weren't acceptable citations. So I switched to FlipHTML5 Downloader PDFs: ${SITE_URL}`,
    `Had to send a book to someone on a bad connection. The FlipHTML5 Downloader PDF actually opened for them: ${SITE_URL}`,
    `Kept a tab open for a book 8 months because I couldn't save it. Closed it today thanks to FlipHTML5 Downloader: ${SITE_URL}`,
];

const ERROR_MESSAGES: Record<string, string> = {
    invalid_tweet_url:
        "Please enter a valid X (Twitter) post link, e.g. https://x.com/yourname/status/1234567890123456789.",
    invalid_email: "Please enter a valid email address.",
    missing_link: `Your post text must include the site link: ${SITE_URL}`,
    already_requested:
        "This email already has a pending or approved request. Please wait for the review.",
    tweet_already_used: "This post link has already been submitted.",
    unavailable: "Service temporarily unavailable. Please try again later.",
};

// 优先 navigator.clipboard，降级到 execCommand（非 HTTPS 上下文也可用）。
async function copyText(text: string): Promise<boolean> {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch {
        // fall through
    }
    try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        return ok;
    } catch {
        return false;
    }
}

export default function TweetPassClient() {
    const [tweetText, setTweetText] = useState(TWEET_TEMPLATES[0]);
    const [tweetUrl, setTweetUrl] = useState("");
    const [email, setEmail] = useState("");
    const [copied, setCopied] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);

    // 挂载后随机展示一条内置文案（初始值固定为首条，避免 SSR 与客户端渲染不一致）。
    // 放入微任务，避免 effect 体内同步 setState 触发级联渲染。
    useEffect(() => {
        queueMicrotask(() =>
            setTweetText(TWEET_TEMPLATES[Math.floor(Math.random() * TWEET_TEMPLATES.length)]),
        );
    }, []);

    // 手动换一条：从模板中随机取一条不同于当前文案的。
    const randomize = () => {
        if (TWEET_TEMPLATES.length <= 1) return;
        const current = TWEET_TEMPLATES.indexOf(tweetText);
        let i = Math.floor(Math.random() * TWEET_TEMPLATES.length);
        while (i === current) i = Math.floor(Math.random() * TWEET_TEMPLATES.length);
        setTweetText(TWEET_TEMPLATES[i]);
    };

    const handleCopy = async () => {
        const ok = await copyText(tweetText);
        if (ok) {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } else {
            toast.error("Copy failed — please select the text and copy manually.");
        }
    };

    const handleSubmit = async () => {
        if (busy) return;
        setError("");
        setBusy(true);
        try {
            const res = await fetch("/api/free-pass/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // website 为蜜罐字段，正常用户留空
                body: JSON.stringify({ tweetText, tweetUrl, email, website: "" }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.ok) {
                setDone(true);
                return;
            }
            setError(ERROR_MESSAGES[data.error] || "Something went wrong. Please try again.");
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setBusy(false);
        }
    };

    if (done) {
        return (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center space-y-2">
                <Check className="w-8 h-8 mx-auto text-green-600" />
                <h3 className="text-lg font-bold text-green-800">Request submitted!</h3>
                <p className="text-sm text-green-700 leading-relaxed">
                    Thanks for sharing. Our team will verify your post and email your free
                    pass code to <span className="font-semibold">{email}</span> shortly.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Step 1: 关注 @aivaded */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 space-y-3">
                <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white">1</span>
                    <h2 className="text-base font-bold text-gray-900">Follow @aivaded on X</h2>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                    <span className="font-semibold text-gray-900">@aivaded</span> is the X
                    account of the developer behind this service — we share free pass code
                    giveaways and product updates there from time to time. Please hit Follow
                    first; we check it when reviewing your request.
                </p>
                <a
                    href={X_PROFILE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity"
                >
                    <Twitter className="w-4 h-4" />
                    Follow @aivaded
                    <ExternalLink className="w-3.5 h-3.5" />
                </a>
            </section>

            {/* Step 2: 发帖 */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 space-y-3">
                <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white">2</span>
                    <h2 className="text-base font-bold text-gray-900">Post about FlipHTML5 Downloader on X</h2>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                    Write a post introducing this service. It must include the site link
                    and a short description. We drafted one for you — shuffle or edit it,
                    then post it with the button below.
                </p>
                <textarea
                    value={tweetText}
                    onChange={(e) => setTweetText(e.target.value)}
                    rows={4}
                    maxLength={280}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-gray-400">{tweetText.length}/280</span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={randomize}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-gray-400 transition-colors"
                        >
                            <Shuffle className="w-3.5 h-3.5" />
                            Shuffle
                        </button>
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-gray-400 transition-colors"
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                            {copied ? "Copied" : "Copy"}
                        </button>
                    </div>
                </div>
                <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity"
                >
                    <Twitter className="w-4 h-4" />
                    Post to X
                </a>
            </section>

            {/* Step 3: 提交 */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 space-y-3">
                <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white">3</span>
                    <h2 className="text-base font-bold text-gray-900">Submit your post link &amp; email</h2>
                </div>
                <label className="block space-y-1.5">
                    <span className="text-xs font-semibold text-gray-600">Your X post link</span>
                    <input
                        value={tweetUrl}
                        onChange={(e) => setTweetUrl(e.target.value)}
                        placeholder="https://x.com/yourname/status/1234567890123456789"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
                    />
                </label>
                <label className="block space-y-1.5">
                    <span className="text-xs font-semibold text-gray-600">Email to receive your free pass</span>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
                    />
                </label>
                {error && <p className="text-xs text-red-500 leading-relaxed">{error}</p>}
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={busy || !tweetUrl.trim() || !email.trim()}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Submit request
                </button>
                <p className="text-center text-[11px] text-gray-400">
                    Make sure you follow @aivaded first. We review posts manually and email
                    your code within 24 hours once approved.
                </p>
            </section>
        </div>
    );
}
