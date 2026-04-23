import fs from "fs";
import path from "path";
import Link from "next/link";
import matter from "gray-matter";

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
}

export default function BlogList() {
  const blogsDir = path.join(process.cwd(), "blogs");
  const files = fs.readdirSync(blogsDir).filter((f) => f.endsWith(".md"));

  const posts: BlogPost[] = files
    .map((file) => {
      const slug = file.replace(".md", "");
      const fullPath = path.join(blogsDir, file);
      const content = fs.readFileSync(fullPath, "utf-8");
      const { data } = matter(content);

      return {
        slug,
        title: data.title || slug,
        description: data.description || "",
        date: data.date || "",
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Blog文章</h1>
      <div className="space-y-6">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="block">
            <article className="border rounded-lg p-6 hover:shadow-lg transition">
              <h2 className="text-2xl font-semibold mb-2">{post.title}</h2>
              <p className="text-gray-600 mb-2">{post.description}</p>
              <time className="text-sm text-gray-500">{post.date}</time>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
