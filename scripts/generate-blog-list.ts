/**
 * 构建时脚本：扫描 blogs 目录并生成博客列表 JSON 文件
 * 在 pnpm run build 时执行，确保 sitemap 能获取最新的博客列表
 * 同时会将新增的博客链接提交到搜索引擎进行SEO索引
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { submitUrlToSearchEngine } from "../lib/seo";

const blogsDir = path.join(process.cwd(), "blogs");
const outputFile = path.join(process.cwd(), "lib", "blog-list.json");

interface BlogPost {
  slug: string;
  date: string;
  title: string;
}

/**
 * 加载已有的博客列表（如果存在）
 */
function loadExistingBlogList(): Set<string> {
  try {
    if (fs.existsSync(outputFile)) {
      const content = fs.readFileSync(outputFile, "utf-8");
      const existingBlogs: BlogPost[] = JSON.parse(content);
      return new Set(existingBlogs.map((blog) => blog.slug));
    }
  } catch (error) {
    console.warn("⚠️  Failed to load existing blog list:", error);
  }
  return new Set();
}

async function generateBlogList(): Promise<void> {
  console.log("📝 Generating blog list...");

  // 加载已有的博客列表，用于识别新增的博客
  const existingSlugs = loadExistingBlogList();
  console.log(`📚 Found ${existingSlugs.size} existing blogs`);

  if (!fs.existsSync(blogsDir)) {
    console.warn("⚠️  Blogs directory not found:", blogsDir);
    // 生成空列表
    fs.writeFileSync(outputFile, JSON.stringify([], null, 2), "utf-8");
    console.log("✅ Generated empty blog list");
    return;
  }

  const blogFiles = fs.readdirSync(blogsDir).filter((f) => f.endsWith(".md"));
  console.log(`📄 Found ${blogFiles.length} blog files`);

  const blogPosts: BlogPost[] = blogFiles.map((file) => {
    const slug = file.replace(".md", "");
    const fullPath = path.join(blogsDir, file);
    const content = fs.readFileSync(fullPath, "utf-8");
    const { data } = matter(content);

    return {
      slug,
      date: data.date
        ? new Date(data.date).toISOString()
        : new Date().toISOString(),
      title: data.title || slug,
    };
  });

  // 按日期排序（最新的在前）
  blogPosts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  // 识别新增的博客
  const newBlogs = blogPosts.filter((blog) => !existingSlugs.has(blog.slug));
  console.log(`🆕 Found ${newBlogs.length} new blog(s)`);

  // 保存博客列表到 JSON 文件
  fs.writeFileSync(outputFile, JSON.stringify(blogPosts, null, 2), "utf-8");
  console.log(`✅ Generated blog list with ${blogPosts.length} posts`);
  console.log(`📁 Output: ${outputFile}`);

  // 提交新增的博客到搜索引擎
  if (newBlogs.length > 0) {
    console.log("\n🚀 Submitting new blogs to search engine...");
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "https://fliphtml5.aivaded.com";

    for (const blog of newBlogs) {
      const blogUrl = `${baseUrl}/blog/${blog.slug}`;
      console.log(`\n📝 Submitting: ${blog.title}`);
      await submitUrlToSearchEngine(blogUrl, `blog post "${blog.title}"`);
    }

    console.log(
      `\n✅ Submitted ${newBlogs.length} new blog(s) to search engine`,
    );
  }
}

generateBlogList().catch((error) => {
  console.error("❌ Failed to generate blog list:", error);
  process.exit(1);
});
