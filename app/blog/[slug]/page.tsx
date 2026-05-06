import { notFound } from "next/navigation";
import { Metadata } from "next";
import { marked } from "marked";
import hljs from "highlight.js";
import { getBlogContent } from "@/lib/blog-utils";
import blogList from "@/lib/blog-list.json";

// 配置 marked 使用 highlight.js
const renderer = new marked.Renderer();
renderer.code = ({ text, lang }) => {
  const validLang = lang && hljs.getLanguage(lang);
  const highlighted = validLang
    ? hljs.highlight(text, { language: lang }).value
    : hljs.highlightAuto(text).value;
  return `<pre><code class="hljs ${lang || ""}">${highlighted}</code></pre>`;
};

marked.setOptions({ renderer });

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ projectId?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { slug } = await params;
  const { projectId: urlProjectId } = await searchParams;

  // 优先使用URL参数，否则使用环境变量
  const projectId = urlProjectId || process.env.EXTERNAL_BLOG_PROJECT_ID;

  // 使用统一的获取函数
  const blogContent = await getBlogContent(slug, projectId);

  if (blogContent) {
    return {
      title: `${blogContent.title} | Blog`,
      description: blogContent.description,
    };
  }

  // 尝试从博客列表JSON中查找（构建时生成）
  const blogFromList = blogList.find((b: any) => b.slug === slug);
  if (blogFromList) {
    return {
      title: `${blogFromList.title} | Blog`,
      description: "",
    };
  }

  return { title: "文章未找到" };
}

export default async function BlogPost({ params, searchParams }: Props) {
  const { slug } = await params;
  const { projectId: urlProjectId } = await searchParams;

  // 优先使用URL参数，否则使用环境变量
  const projectId = urlProjectId || process.env.EXTERNAL_BLOG_PROJECT_ID;

  // 使用统一的获取函数
  const blogContent = await getBlogContent(slug, projectId);

  if (!blogContent) {
    notFound();
  }

  const html = await marked(blogContent.content);

  return (
    <article className="max-w-4xl mx-auto px-4 py-12">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{blogContent.title}</h1>
        {blogContent.description && (
          <p className="text-xl text-gray-600 mb-4">
            {blogContent.description}
          </p>
        )}
        <time className="text-gray-500">
          {new Date(blogContent.date).toLocaleDateString("zh-CN")}
        </time>
      </header>

      <div
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  );
}
