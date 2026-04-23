import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { marked } from "marked";
import hljs from "highlight.js";
import matter from "gray-matter";

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
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const blogsDir = path.join(process.cwd(), "blogs");
  const filePath = path.join(blogsDir, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return { title: "文章未找到" };
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const { data } = matter(content);

  return {
    title: `${data.title} | Blog`,
    description: data.description,
  };
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const blogsDir = path.join(process.cwd(), "blogs");
  const filePath = path.join(blogsDir, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    notFound();
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const { data, content: markdownContent } = matter(content);
  const html = await marked(markdownContent);

  return (
    <article className="max-w-4xl mx-auto px-4 py-12">
      <div
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  );
}
