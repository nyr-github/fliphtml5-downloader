import React from "react";
import { getBookById } from "@/lib/actions";
import { notFound } from "next/navigation";
import BookReaderClient from "@/components/BookReaderClient";
import { buildThumbnailUrl } from "@/lib/utils";
import { Metadata } from "next";

/**
 * /read/iframe/[id]
 *
 * 专为外部站点 iframe 嵌入设计的电子书在线阅读页面：
 * - 不渲染顶部菜单 (Navbar) 与页脚 (Footer)（由 LayoutShell 根据路径处理）
 * - 全视口高度，适合嵌入到任意容器中
 * - 通过 <iframe src="/read/iframe/[id]"> 即可在第三方站点内嵌入
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const book = await getBookById(id);

  if (!book) {
    return {
      title: "Book Not Found",
      description: "The requested book could not be found.",
      robots: { index: false, follow: false },
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yourdomain.com";
  const thumbnailFull = buildThumbnailUrl(book.thumbnail, book.id1, book.id2);

  return {
    title: `${book.title} - Embedded Flipbook Reader`,
    description:
      book.description ||
      `Read "${book.title}" online. ${book.pageCount} pages embedded flipbook viewer.`,
    openGraph: {
      title: `${book.title} - Embedded Flipbook Reader`,
      description:
        book.description ||
        `Read "${book.title}" online. ${book.pageCount} pages embedded flipbook viewer.`,
      type: "article",
      images: [
        {
          url: thumbnailFull,
          width: 800,
          height: 600,
          alt: book.title,
        },
      ],
    },
    alternates: {
      canonical: `${baseUrl}/read/iframe/${id}`,
    },
    // 嵌入页不参与 SEO 索引，避免与 /read/[id] 重复
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function IframeReaderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    page?: string;
    dual?: string;
    thumbnails?: string;
  }>;
}) {
  const { id } = await params;
  const sp = (await searchParams) || {};
  const book = await getBookById(id);

  if (!book) {
    notFound();
  }

  // 解析嵌入配置参数
  // page: 1-based 转换为 0-based，越界或非法时不传
  const pageNum = sp.page ? parseInt(sp.page, 10) : NaN;
  const initialPage =
    Number.isFinite(pageNum) && pageNum >= 1 && pageNum <= book.pageCount
      ? pageNum - 1
      : undefined;
  // dual=1 启用双页
  const initialDualPage = sp.dual === "1" || sp.dual === "true";
  // thumbnails=0 隐藏按钮（默认显示）
  const hideThumbnailsButton =
    sp.thumbnails === "0" || sp.thumbnails === "false";

  return (
    <div className="bg-black fixed inset-0 w-screen h-screen overflow-hidden">
      <BookReaderClient
        dbId={id}
        id1={book.id1}
        id2={book.id2}
        title={book.title}
        from="iframe"
        initialPage={initialPage}
        initialDualPage={initialDualPage}
        hideThumbnailsButton={hideThumbnailsButton}
      />
    </div>
  );
}
