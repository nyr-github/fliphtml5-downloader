export interface QAItem {
  question: string;
  answer: string;
}

export const qaData: QAItem[] = [
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
    question: "Is this service completely free?",
    answer:
      "Yes, 100% free with no limitations. No hidden fees, no premium tiers, no watermarks on your PDFs.",
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
      "Check your network connection and try again. Some publications may have server-side protections. You can also join our Discord for support.",
  },
  {
    question: "Do you support other flipbook platforms besides FlipHTML5?",
    answer:
      "Currently, we only support FlipHTML5. Support for other platforms may be added in the future based on user demand.",
  },
];
