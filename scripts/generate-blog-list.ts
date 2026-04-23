/**
 * 构建时脚本：扫描 blogs 目录并生成博客列表 JSON 文件
 * 在 pnpm run build 时执行，确保 sitemap 能获取最新的博客列表
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";

const blogsDir = path.join(process.cwd(), "blogs");
const outputFile = path.join(process.cwd(), "lib", "blog-list.json");

interface BlogPost {
  slug: string;
  date: string;
  title: string;
}

function generateBlogList(): void {
  console.log("📝 Generating blog list...");

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

  fs.writeFileSync(outputFile, JSON.stringify(blogPosts, null, 2), "utf-8");
  console.log(`✅ Generated blog list with ${blogPosts.length} posts`);
  console.log(`📁 Output: ${outputFile}`);
}

generateBlogList();
