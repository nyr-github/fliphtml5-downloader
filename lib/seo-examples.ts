/**
 * SEO 提交功能使用示例
 *
 * 本文档展示如何在不同场景下使用 lib/seo.ts 中的 SEO 提交功能
 */

import {
  buildBookUrl,
  submitUrlToSearchEngine,
  submitBookToSearchEngine,
} from "./seo";

// ==========================================
// 示例 1: 提交新书籍（在 API 路由中使用）
// ==========================================
async function example1_submitNewBook() {
  const id1 = "abc123";
  const id2 = "def456";
  const title = "My Awesome Book";

  // 方式 A: 使用专用的书籍提交函数（推荐）
  await submitBookToSearchEngine(id1, id2, title);

  // 方式 B: 手动构建 URL 并提交
  const bookUrl = buildBookUrl(id1, id2);
  await submitUrlToSearchEngine(bookUrl, `book "${title}"`);
}

// ==========================================
// 示例 2: 提交新博客（在构建脚本中使用）
// ==========================================
async function example2_submitNewBlog() {
  const slug = "how-to-download-flipbook";
  const title = "How to Download Flipbook";
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://fliphtml5.aivaded.com";

  const blogUrl = `${baseUrl}/blog/${slug}`;
  await submitUrlToSearchEngine(blogUrl, `blog post "${title}"`);
}

// ==========================================
// 示例 3: 批量提交多个页面
// ==========================================
async function example3_submitMultiplePages() {
  const pages = [
    { url: "https://fliphtml5.aivaded.com", description: "homepage" },
    { url: "https://fliphtml5.aivaded.com/qa", description: "Q&A page" },
    {
      url: "https://fliphtml5.aivaded.com/all-apps",
      description: "all apps page",
    },
  ];

  // 串行提交（推荐，避免并发过多请求）
  for (const page of pages) {
    await submitUrlToSearchEngine(page.url, page.description);
  }

  // 或者并行提交（快速但可能触发限流）
  // await Promise.all(
  //   pages.map(page => submitUrlToSearchEngine(page.url, page.description))
  // );
}

// ==========================================
// 示例 4: 在博客创建 API 中使用
// ==========================================
async function example4_blogCreationAPI() {
  // 假设这是创建博客后的逻辑
  const newBlog = {
    slug: "new-blog-post",
    title: "New Blog Post",
  };

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://fliphtml5.aivaded.com";
  const blogUrl = `${baseUrl}/blog/${newBlog.slug}`;

  // 提交到搜索引擎（异步，不阻塞响应）
  submitUrlToSearchEngine(blogUrl, `blog post "${newBlog.title}"`).catch(
    (err) => console.error("Failed to submit blog:", err),
  );

  // 立即返回响应
  return { success: true };
}

// ==========================================
// 示例 5: 错误处理
// ==========================================
async function example5_errorHandling() {
  try {
    await submitUrlToSearchEngine(
      "https://fliphtml5.aivaded.com/book/test",
      "test book",
    );
    console.log("✅ Submission successful");
  } catch (error) {
    // 即使提交失败，也不影响主流程
    console.error("❌ Submission failed:", error);
  }
}

// ==========================================
// 示例 6: 在 Cron 任务中定期提交
// ==========================================
async function example6_cronJob() {
  // 假设从数据库获取最近更新的书籍
  const recentBooks = [
    { id1: "abc", id2: "123", title: "Book 1" },
    { id1: "def", id2: "456", title: "Book 2" },
  ];

  for (const book of recentBooks) {
    const bookUrl = buildBookUrl(book.id1, book.id2);
    await submitUrlToSearchEngine(bookUrl, `updated book "${book.title}"`);
  }
}

// 导出示例函数供参考
export {
  example1_submitNewBook,
  example2_submitNewBlog,
  example3_submitMultiplePages,
  example4_blogCreationAPI,
  example5_errorHandling,
  example6_cronJob,
};
