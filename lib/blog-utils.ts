import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  type: "local" | "external";
  sourceUrl?: string;
  sourceEngine?: string;
}

export interface ExternalBlogPost {
  id: number;
  title: string;
  slug: string;
  summary: string;
  sourceUrl: string;
  sourceEngine: string;
  publishedAt: string;
  createdAt: string;
}

export interface ExternalBlogDetail {
  id: number;
  projectName: string;
  title: string;
  slug: string;
  content: string;
  summary: string;
  sourceUrl: string;
  sourceEngine: string;
  publishedAt: string;
  createdAt: string;
}

/**
 * 获取本地博客列表
 */
export function getLocalBlogs(): BlogPost[] {
  const blogsDir = path.join(process.cwd(), "blogs");

  if (!fs.existsSync(blogsDir)) {
    return [];
  }

  const files = fs.readdirSync(blogsDir).filter((f) => f.endsWith(".md"));

  return files.map((file) => {
    const slug = file.replace(".md", "");
    const fullPath = path.join(blogsDir, file);
    const content = fs.readFileSync(fullPath, "utf-8");
    const { data } = matter(content);

    return {
      slug,
      title: data.title || slug,
      description: data.description || "",
      date: data.date
        ? new Date(data.date).toISOString()
        : new Date().toISOString(),
      type: "local" as const,
    };
  });
}

/**
 * 获取外部API博客列表
 * @param projectId 项目ID
 */
export async function getExternalBlogs(projectId: string): Promise<BlogPost[]> {
  try {
    const apiUrl = `https://plausible.aivaded.com/api/blogs/${projectId}`;
    const response = await fetch(apiUrl); // 缓存1小时

    if (!response.ok) {
      console.warn(`⚠️ Failed to fetch external blogs: ${response.status}`);
      return [];
    }

    const result = await response.json();

    if (!result.success || !result.data) {
      return [];
    }

    const externalBlogs: ExternalBlogPost[] = result.data;

    return externalBlogs.map((blog) => ({
      slug: blog.slug,
      title: blog.title,
      description: blog.summary,
      date: blog.publishedAt,
      type: "external" as const,
      sourceUrl: blog.sourceUrl,
      sourceEngine: blog.sourceEngine,
    }));
  } catch (error) {
    console.error("❌ Error fetching external blogs:", error);
    return [];
  }
}

/**
 * 获取外部API博客详情
 * @param projectId 项目ID
 * @param slug 博客slug
 */
export async function getExternalBlogDetail(
  projectId: string,
  slug: string,
): Promise<ExternalBlogDetail | null> {
  try {
    const apiUrl = `https://plausible.aivaded.com/api/blogs/${projectId}/${slug}`;
    const response = await fetch(apiUrl, { next: { revalidate: 3600 } });

    if (!response.ok) {
      console.warn(
        `⚠️ Failed to fetch external blog detail: ${response.status}`,
      );
      return null;
    }

    const result = await response.json();

    if (!result.success || !result.data) {
      return null;
    }

    return result.data;
  } catch (error) {
    console.error("❌ Error fetching external blog detail:", error);
    return null;
  }
}

/**
 * 获取所有博客列表（本地 + 外部）
 * @param projectId 外部API项目ID（可选）
 */
export async function getAllBlogs(projectId?: string): Promise<BlogPost[]> {
  const localBlogs = getLocalBlogs();

  if (!projectId) {
    return localBlogs.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }

  const externalBlogs = await getExternalBlogs(projectId);

  // 合并并按日期排序
  return [...localBlogs, ...externalBlogs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export interface BlogContent {
  title: string;
  description: string;
  content: string;
  date: string;
  source: "local" | "external";
}

/**
 * 获取博客内容（优先本地，其次外部API）
 * @param slug 博客slug
 * @param projectId 外部API项目ID（可选）
 */
export async function getBlogContent(
  slug: string,
  projectId?: string,
): Promise<BlogContent | null> {
  // 1. 优先尝试本地文件
  const blogsDir = path.join(process.cwd(), "blogs");
  const filePath = path.join(blogsDir, `${slug}.md`);

  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    const { data, content: markdownContent } = matter(content);

    return {
      title: data.title || slug,
      description: data.description || "",
      content: markdownContent,
      date: data.date
        ? new Date(data.date).toISOString()
        : new Date().toISOString(),
      source: "local",
    };
  }

  // 2. 尝试从外部API获取
  if (projectId) {
    const externalBlog = await getExternalBlogDetail(projectId, slug);

    if (externalBlog) {
      return {
        title: externalBlog.title,
        description: externalBlog.summary,
        content: externalBlog.content,
        date: externalBlog.publishedAt,
        source: "external",
      };
    }
  }

  return null;
}
