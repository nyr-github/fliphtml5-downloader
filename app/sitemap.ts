import { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { books } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import blogList from "@/lib/blog-list.json";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yourdomain.com";

  // 静态页面
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/qa`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/all-apps`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  // 限制书籍数量以避免sitemap过大 (最多50000个URL)
  const allBooks = await db
    .select({
      id: books.id,
      updatedAt: books.updatedAt,
    })
    .from(books)
    .orderBy(sql`${books.downloadCount} DESC`)
    .limit(10000); // 限制查询数量

  // 书籍详情页和阅读页
  const bookPages: MetadataRoute.Sitemap = allBooks.map((book) => ({
    url: `${baseUrl}/book/${book.id}`,
    lastModified: new Date(book.updatedAt),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const readPages: MetadataRoute.Sitemap = allBooks.map((book) => ({
    url: `${baseUrl}/read/${book.id}`,
    lastModified: new Date(book.updatedAt),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // 博客文章页面 - 从构建时生成的 JSON 文件读取
  const blogPages: MetadataRoute.Sitemap = blogList.map(
    (post: { slug: string; date: string }) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }),
  );

  // 分页页面 (限制最多100页)
  const totalBooks = allBooks.length;
  const pageSize = 24;
  const totalPages = Math.min(Math.ceil(totalBooks / pageSize), 100);

  const paginationPages: MetadataRoute.Sitemap = [];
  for (let page = 1; page <= totalPages; page++) {
    paginationPages.push({
      url: page === 1 ? baseUrl : `${baseUrl}?page=${page}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: page === 1 ? 1 : 0.6,
    });
  }

  return [
    ...staticPages,
    ...bookPages,
    ...readPages,
    ...blogPages,
    ...paginationPages,
  ];
}
