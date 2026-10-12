import { passConfig } from "@/lib/discord-pass";

export interface QAItem {
  question: string;
  answer: string;
}

// 免费券相关的天数 / 每码次数 / 每日发放数量随配置（env）变化，FAQ 文案按当前配置生成。
export function getQaData(): QAItem[] {
  const { weekDays, passMaxUses, passBatchSize } = passConfig();
  return [
    {
      question: "What is FlipHTML5 Downloader?",
      answer:
        "A free online tool that converts FlipHTML5 flipbook publications into high-quality PDF files instantly. No registration required.",
    },
    {
      question: "How do I download a flipbook as PDF?",
      answer:
        "Paste the FlipHTML5 URL into the input box on the homepage and click download. The PDF will be generated and downloaded automatically.",
    },
    {
      question:
        "How can I quickly convert a FlipHTML5 URL to download using your service?",
      answer:
        "Simply edit the URL directly in your browser's address bar! Replace 'fliphtml5.com' with 'fliphtml5.aivaded.com' and press Enter.",
    },
    {
      question: "Is this service completely free?",
      answer:
        `Every day your first PDF download is completely free. After that you can either pay a one-time $1 to unlock a single book (kept forever in this browser), grab a $5 weekly pass that unlocks every download for ${weekDays} days, or redeem a free ${weekDays}-day pass code we give out in our Discord community and on X. Any book you have already paid for stays unlocked permanently, so you never pay for the same file twice. PDFs always come with no watermarks.`,
    },
    {
      question: "Why do I have to pay after my free download?",
      answer:
        "Converting flipbooks into high-quality PDFs is compute- and bandwidth-intensive, and every download runs on our own servers. As usage grew we could no longer absorb those server and bandwidth costs, so small charges beyond your daily free download keep the service fast, reliable, and running. It is not about profit — it is about covering the infrastructure that makes each download work.",
    },
    {
      question: "How does the payment and unlock work?",
      answer:
        `Once your free download for the day is used, the checkout dialog offers two options: pay $1 to unlock just this one book, or pay $5 for a ${weekDays}-day weekly pass that unlocks every download. Payment runs through PayPal; once it is confirmed the unlock is written straight into your browser (IndexedDB for the single-file license, localStorage for the weekly pass expiry), and your current download resumes automatically.`,
    },
    {
      question: `How do I get the free ${weekDays}-day pass from Discord or X?`,
      answer:
        `Join our Discord community — we give out ${passBatchSize} free ${weekDays}-day pass codes every day, and we also drop extra free codes from time to time on X (@aivaded). Each code can be redeemed up to ${passMaxUses} times in total by anyone, and every redemption activates the same unlimited ${weekDays}-day pass as the paid weekly pass for that browser. Enter the code in the unlock dialog that appears when your free download is used up — the remaining uses are tracked on our server, so once a code's ${passMaxUses} redemptions are used it stops working.`,
    },
    {
      question: "What does the $5 weekly pass actually cover?",
      answer:
        `The $5 pass unlocks unlimited PDF downloads in this browser for ${weekDays} days starting from the moment it is confirmed — every book, every format, no per-file charge during the window. If you buy it while an existing pass is still active, the new ${weekDays} days are added on top of your current expiry. The pass lives in the same browser only, so switching browser/device, clearing site data, or using incognito mode will lose it, just like the single-file license.`,
    },
    {
      question:
        "I paid for a book but now it asks me to pay again. What happened?",
      answer:
        "Your unlock licenses are stored locally in your current browser's IndexedDB, not on a server tied to an account. Switching to a different browser or device, clearing site/browsing data, or using incognito/private mode removes those credentials, so the unlock is lost and you would need to pay again. Always download from the same browser you used to pay to keep your unlocks.",
    },
    {
      question: "What FlipHTML5 URLs are supported?",
      answer:
        "All standard FlipHTML5 publication URLs in the format: https://online.fliphtml5.com/[id1]/[id2]/",
    },
    {
      question: "Can I download multiple flipbooks at once?",
      answer:
        "Yes, you can submit multiple URLs simultaneously. Each download runs independently with its own progress tracking.",
    },
    {
      question: "Why are some pages missing from my PDF?",
      answer:
        "Some publications use ZIP-compressed resources or complex encryption. Our tool handles most cases, but heavily protected content may have issues.",
    },
    {
      question: "Can I read flipbooks online without downloading?",
      answer:
        "Yes, browse the Discovery section on the homepage and click any book to read it online with our built-in flipbook reader.",
    },
    {
      question: "Is my data stored or shared?",
      answer:
        "We only store basic metadata (title, page count, thumbnail) for successfully downloaded books to power the Discovery feature. No personal information is collected.",
    },
    {
      question: "What is the PDF quality?",
      answer:
        "High-quality. We preserve original page dimensions and use 95% JPEG quality for optimal balance between quality and file size.",
    },
    {
      question: "Does it work on mobile devices?",
      answer:
        "Yes, the website is fully responsive. However, PDF generation may be slower on mobile due to processing limitations.",
    },
    {
      question: "How does the decryption process work?",
      answer:
        "We use FlipHTML5's official decryption scripts (jQuery and WASM module) to decrypt encrypted page configuration, then extract and compile page images into PDF.",
    },
    {
      question: "Can I use this for commercial purposes?",
      answer:
        "Yes, but ensure you have the right to download and use the flipbook content. We only provide the technical tool, not content licensing.",
    },
    {
      question: "What if the download fails or gets stuck?",
      answer:
        "Check your network connection and try again. Some publications may have server-side protections. You can also leave a comment on our X post for support.",
    },
    {
      question: "Do you support other flipbook platforms besides FlipHTML5?",
      answer:
        "Currently, we only support FlipHTML5. Support for other platforms may be added in the future based on user demand.",
    },
  ];
}
