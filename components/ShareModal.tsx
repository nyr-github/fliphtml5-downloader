"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Copy,
  Check,
  Code2,
  MessageCircle,
  Mail,
  Link as LinkIcon,
} from "lucide-react";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  /** 被分享的链接 */
  url: string;
  /** 分享标题 */
  title: string;
  /** 分享描述 / 正文 */
  description?: string;
  /**
   * 分享的书本封面（绝对 URL）。只有 Pinterest 等少数渠道会在
   * URL 中直接携带图片，其它渠道通过目标页面的 og:image 抓取。
   */
  image?: string;
  /**
   * 可嵌入页面 URL（用于"嵌入"渠道生成 iframe 代码）。
   * 不传则不展示嵌入按钮。
   */
  embedUrl?: string;
  /** 书本总页数，用于"嵌入"视图里起始页输入的上限校验 */
  totalPages?: number;
}

type Channel = {
  key: string;
  label: string;
  /** 纯色背景色 */
  bg: string;
  /** 图标颜色 */
  color?: string;
  /** 图标节点 */
  icon: React.ReactNode;
  /** 点击后的动作 */
  onClick: () => void;
};

/**
 * 类 YouTube 风格分享弹框。
 * 支持：嵌入 / X / Facebook / Google Message / WhatsApp / Email /
 *       Reddit / Pinterest / LinkedIn / 链接复制
 */
export default function ShareModal({
  open,
  onClose,
  url,
  title,
  description,
  image,
  embedUrl,
  totalPages,
}: ShareModalProps) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  // 嵌入配置项
  const [embedStartPage, setEmbedStartPage] = useState<number | "">("");
  const [embedDualPage, setEmbedDualPage] = useState(false);
  const [embedShowThumbnails, setEmbedShowThumbnails] = useState(true);

  // 关闭时重置子状态
  useEffect(() => {
    if (!open) {
      setLinkCopied(false);
      setEmbedCopied(false);
      setShowEmbed(false);
      setEmbedStartPage("");
      setEmbedDualPage(false);
      setEmbedShowThumbnails(true);
    }
  }, [open]);

  // ESC 关闭
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // 锁滚动
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const shareText = description || title;
  const enc = encodeURIComponent;

  // 根据嵌入配置拼接最终 src 及 iframe 代码
  const embedSrc = useMemo(() => {
    if (!embedUrl) return "";
    const qs: string[] = [];
    if (typeof embedStartPage === "number" && embedStartPage > 1) {
      qs.push(`page=${embedStartPage}`);
    }
    if (embedDualPage) qs.push("dual=1");
    if (!embedShowThumbnails) qs.push("thumbnails=0");
    return qs.length ? `${embedUrl}?${qs.join("&")}` : embedUrl;
  }, [embedUrl, embedStartPage, embedDualPage, embedShowThumbnails]);

  const embedCode = embedUrl
    ? `<iframe src="${embedSrc}" width="800" height="600" frameborder="0" allowfullscreen loading="lazy" title="${title.replace(
        /"/g,
        "&quot;",
      )}"></iframe>`
    : "";

  // 以新标签页打开（不使用 window.open 的 popup 特性，避免触发浏览器弹窗）
  const openInNewTab = (href: string) => {
    const a = document.createElement("a");
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  const handleCopyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setEmbedCopied(true);
      setTimeout(() => setEmbedCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  const channels: Channel[] = useMemo(() => {
    const list: Channel[] = [];

    if (embedUrl) {
      list.push({
        key: "embed",
        label: "Embed",
        bg: "bg-gray-200",
        color: "text-gray-800",
        icon: <Code2 className="w-6 h-6" />,
        onClick: () => setShowEmbed(true),
      });
    }

    list.push(
      {
        key: "x",
        label: "X",
        bg: "bg-black",
        color: "text-white",
        icon: (
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="w-6 h-6 fill-current"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        ),
        onClick: () =>
          openInNewTab(
            `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(
              shareText,
            )}&via=aivaded&hashtags=${enc("FlipHTML5,pdf,downloader")}`,
          ),
      },
      {
        key: "facebook",
        label: "Facebook",
        bg: "bg-[#1877F2]",
        color: "text-white",
        icon: (
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="w-6 h-6 fill-current"
          >
            <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.92 3.77-3.92 1.1 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.9h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94z" />
          </svg>
        ),
        onClick: () =>
          openInNewTab(
            `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
          ),
      },
      {
        key: "message",
        label: "Message",
        bg: "bg-[#1BA1F2]",
        color: "text-white",
        icon: <MessageCircle className="w-6 h-6" />,
        onClick: () => {
          // Google Messages for web
          openInNewTab(
            `https://messages.google.com/web/share?text=${enc(
              `${shareText} ${url}`,
            )}`,
          );
        },
      },
      {
        key: "whatsapp",
        label: "WhatsApp",
        bg: "bg-[#25D366]",
        color: "text-white",
        icon: (
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="w-6 h-6 fill-current"
          >
            <path d="M20.52 3.48A11.87 11.87 0 0 0 12.04 0C5.5 0 .2 5.3.2 11.83c0 2.08.55 4.12 1.6 5.92L0 24l6.42-1.68a11.86 11.86 0 0 0 5.62 1.43h.01c6.53 0 11.83-5.3 11.83-11.83 0-3.16-1.23-6.13-3.36-8.44zM12.04 21.7h-.01a9.86 9.86 0 0 1-5.02-1.37l-.36-.22-3.81 1 1.02-3.71-.24-.38a9.85 9.85 0 0 1-1.51-5.19c0-5.43 4.42-9.85 9.85-9.85 2.63 0 5.1 1.03 6.96 2.88a9.77 9.77 0 0 1 2.89 6.97c0 5.43-4.43 9.87-9.77 9.87zm5.4-7.38c-.3-.15-1.76-.86-2.03-.96-.27-.1-.47-.15-.67.15s-.77.96-.94 1.16c-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48a9.07 9.07 0 0 1-1.67-2.07c-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.11 3.22 5.11 4.51.71.31 1.27.49 1.7.63.72.23 1.37.2 1.88.12.58-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35z" />
          </svg>
        ),
        onClick: () =>
          openInNewTab(`https://wa.me/?text=${enc(`${shareText} ${url}`)}`),
      },
      {
        key: "email",
        label: "Email",
        bg: "bg-gray-700",
        color: "text-white",
        icon: <Mail className="w-6 h-6" />,
        onClick: () => {
          window.location.href = `mailto:?subject=${enc(title)}&body=${enc(
            `${shareText}\n\n${url}`,
          )}`;
        },
      },
      {
        key: "reddit",
        label: "Reddit",
        bg: "bg-[#FF4500]",
        color: "text-white",
        icon: (
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="w-6 h-6 fill-current"
          >
            <path d="M22 12c0-1.1-.9-2-2-2-.5 0-1 .2-1.4.5A10 10 0 0 0 13.3 8l.9-4 2.8.6c0 .9.8 1.6 1.7 1.5.9 0 1.6-.8 1.6-1.7 0-.9-.8-1.6-1.7-1.6-.6 0-1.2.4-1.5 1l-3.2-.7c-.1 0-.2 0-.3.1 0 0-.1.1-.1.2l-1 4.5A10 10 0 0 0 5.4 10.5 2 2 0 0 0 2 12c0 .8.5 1.6 1.2 1.9 0 .3-.1.5-.1.8 0 3.3 3.9 6 8.7 6s8.7-2.7 8.7-6c0-.3 0-.5-.1-.8.7-.3 1.2-1.1 1.2-1.9zM7 13.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zM15.7 17a7 7 0 0 1-3.7.9 7 7 0 0 1-3.7-.9c-.2-.2-.2-.5 0-.7.2-.2.5-.2.7 0 .7.5 1.8.7 3 .7s2.3-.2 3-.7c.2-.2.5-.2.7 0 .2.2.2.5 0 .7zm-.2-2a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
          </svg>
        ),
        onClick: () =>
          openInNewTab(
            `https://www.reddit.com/submit?url=${enc(url)}&title=${enc(title)}`,
          ),
      },
      {
        key: "pinterest",
        label: "Pinterest",
        bg: "bg-[#E60023]",
        color: "text-white",
        icon: (
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="w-6 h-6 fill-current"
          >
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.09 3.16 9.43 7.63 11.18-.1-.95-.2-2.4.04-3.44.22-.92 1.41-5.85 1.41-5.85s-.36-.72-.36-1.78c0-1.67.97-2.92 2.17-2.92 1.02 0 1.52.77 1.52 1.69 0 1.03-.66 2.57-1 4-.28 1.2.6 2.17 1.78 2.17 2.14 0 3.78-2.26 3.78-5.52 0-2.88-2.07-4.9-5.03-4.9-3.43 0-5.44 2.57-5.44 5.23 0 1.04.4 2.15.9 2.75.1.12.11.22.08.34l-.33 1.35c-.05.22-.17.27-.4.16-1.5-.7-2.44-2.9-2.44-4.66 0-3.8 2.76-7.3 7.96-7.3 4.17 0 7.42 2.97 7.42 6.95 0 4.15-2.62 7.49-6.25 7.49-1.22 0-2.37-.64-2.76-1.39l-.75 2.87c-.27 1.04-1 2.36-1.49 3.16A12 12 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
        ),
        onClick: () =>
          openInNewTab(
            `https://pinterest.com/pin/create/button/?url=${enc(
              url,
            )}&description=${enc(shareText)}${
              image ? `&media=${enc(image)}` : ""
            }`,
          ),
      },
      {
        key: "linkedin",
        label: "LinkedIn",
        bg: "bg-[#0A66C2]",
        color: "text-white",
        icon: (
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="w-6 h-6 fill-current"
          >
            <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .78 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .78 23.2 0 22.22 0z" />
          </svg>
        ),
        onClick: () =>
          openInNewTab(
            `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
          ),
      },
    );

    return list;
  }, [embedUrl, url, title, shareText, image]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="share-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />
          {/* Dialog */}
          <div className="fixed inset-0 z-[101] overflow-y-auto overscroll-contain">
            <div className="min-h-full flex items-start sm:items-center justify-center p-4 pointer-events-none">
              <motion.div
                key="share-dialog"
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={`pointer-events-auto w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col sm:max-h-[92vh] ${
                  showEmbed ? "max-w-4xl" : "max-w-xl"
                }`}
                role="dialog"
                aria-modal="true"
                aria-label="Share"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 shrink-0">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                    {showEmbed ? "Embed" : "Share"}
                  </h2>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body */}
                {!showEmbed ? (
                  <div className="px-5 sm:px-6 pt-4 pb-5">
                    {/* Channels scroller */}
                    <div className="-mx-1 pb-2">
                      <div className="flex items-start justify-around md:justify-start gap-4 px-1 flex-wrap ">
                        {channels.map((c) => (
                          <button
                            key={c.key}
                            type="button"
                            onClick={c.onClick}
                            className="flex flex-col items-center gap-2 w-16 group focus:outline-none"
                          >
                            <span
                              className={`w-14 h-14 rounded-full ${c.bg} ${
                                c.color || "text-white"
                              } flex items-center justify-center shadow-sm group-hover:scale-105 group-active:scale-95 transition-transform`}
                            >
                              {c.icon}
                            </span>
                            <span className="text-[11px] font-medium text-gray-700 truncate w-full text-center">
                              {c.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Link row */}
                    <div className="mt-5 flex items-center gap-2 rounded-full bg-gray-100 border border-gray-200 pl-4 pr-1.5 py-1.5 w-full overflow-hidden">
                      <LinkIcon className="w-4 h-4 text-gray-500 shrink-0" />
                      <input
                        type="text"
                        readOnly
                        value={url}
                        onFocus={(e) => e.currentTarget.select()}
                        className="flex-1 min-w-0 bg-transparent text-sm text-gray-800 outline-none truncate"
                      />
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors ${
                          linkCopied
                            ? "bg-green-600 text-white"
                            : "bg-[var(--color-primary)] text-white hover:opacity-90"
                        }`}
                      >
                        {linkCopied ? (
                          <>
                            <Check className="w-4 h-4" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Embed view */
                  <>
                    <div className="px-5 sm:px-6 pt-4 pb-4 overflow-y-auto flex-1 min-h-0">
                      <p className="text-sm text-gray-600 mb-3">
                        Customize how the reader opens, then paste this HTML
                        into your website:
                      </p>

                      {/* 左右布局：左=预览、右=代码块+设置项；移动端单列堆叠 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Live preview (移动端放在最后让内容更多一坡就被看见) */}
                        <div className="order-2 md:order-1 flex flex-col">
                          <div className="text-xs font-medium text-gray-600 mb-1 flex items-center justify-between">
                            <span>Preview</span>
                            <span className="text-[10px] text-gray-400">
                              Live
                            </span>
                          </div>
                          <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-black aspect-[4/3]">
                            {embedSrc ? (
                              <iframe
                                key={embedSrc}
                                src={embedSrc}
                                title="Embed preview"
                                className="absolute inset-0 w-full h-full"
                                loading="lazy"
                                allowFullScreen
                              />
                            ) : null}
                          </div>
                        </div>

                        {/* 右列：代码块 + 设置项 */}
                        <div className="order-1 md:order-2 flex flex-col gap-3">
                          {/* Code block */}
                          <div className="flex flex-col">
                            <div className="text-xs font-medium text-gray-600 mb-1">
                              HTML
                            </div>
                            <textarea
                              readOnly
                              value={embedCode}
                              onFocus={(e) => e.currentTarget.select()}
                              rows={5}
                              className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-xs text-gray-800 outline-none focus:border-[var(--color-primary)]"
                            />
                          </div>

                          {/* Embed config */}
                          <div className="grid grid-cols-1 gap-2.5">
                            {/* Start page */}
                            <label className="flex flex-col gap-1">
                              <span className="text-xs font-medium text-gray-600">
                                Start page
                                {totalPages ? (
                                  <span className="text-gray-400">
                                    {" "}
                                    (1–{totalPages})
                                  </span>
                                ) : null}
                              </span>
                              <input
                                type="number"
                                min={1}
                                max={totalPages || undefined}
                                placeholder="1"
                                value={
                                  embedStartPage === "" ? "" : embedStartPage
                                }
                                onChange={(e) => {
                                  const v = e.target.value;
                                  if (v === "") {
                                    setEmbedStartPage("");
                                    return;
                                  }
                                  const n = parseInt(v, 10);
                                  if (!Number.isFinite(n)) return;
                                  const max =
                                    totalPages || Number.MAX_SAFE_INTEGER;
                                  setEmbedStartPage(
                                    Math.min(Math.max(n, 1), max),
                                  );
                                }}
                                className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 outline-none focus:border-[var(--color-primary)]"
                              />
                            </label>

                            {/* Two-page mode */}
                            <label className="flex items-center gap-2 h-10 px-3 rounded-lg border border-gray-200 bg-white cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={embedDualPage}
                                onChange={(e) =>
                                  setEmbedDualPage(e.target.checked)
                                }
                                className="w-4 h-4 accent-[var(--color-primary)]"
                              />
                              <span className="text-sm text-gray-800">
                                Two-page mode
                              </span>
                            </label>

                            {/* Thumbnails toggle button */}
                            <label className="flex items-center gap-2 h-10 px-3 rounded-lg border border-gray-200 bg-white cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={embedShowThumbnails}
                                onChange={(e) =>
                                  setEmbedShowThumbnails(e.target.checked)
                                }
                                className="w-4 h-4 accent-[var(--color-primary)]"
                              />
                              <span className="text-sm text-gray-800">
                                Thumbnails button
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer bar (不随内容滚动、始终可点) */}
                    <div className="shrink-0 px-5 sm:px-6 py-3 border-t border-gray-100 flex items-center justify-between gap-3 bg-white">
                      <button
                        type="button"
                        onClick={() => setShowEmbed(false)}
                        className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        ← Back
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyEmbed}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                          embedCopied
                            ? "bg-green-600 text-white"
                            : "bg-[var(--color-primary)] text-white hover:opacity-90"
                        }`}
                      >
                        {embedCopied ? (
                          <>
                            <Check className="w-4 h-4" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" /> Copy code
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
