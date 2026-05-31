import Link from "next/link";
import { getAllBlogs } from "@/lib/blog-utils";

interface Props {
  searchParams: Promise<{ projectId?: string; page?: string }>;
}

const POSTS_PER_PAGE = 20;

// ISR缓存配置：1天(86400秒)
export const revalidate = 86400;

export default async function BlogList({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;

  // 优先使用URL参数，否则使用环境变量
  const projectId = process.env.PROJECT_ID;
  const posts = await getAllBlogs(projectId);

  // 计算分页
  const currentPage = pageParam ? parseInt(pageParam, 10) : 1;
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  const currentPosts = posts.slice(startIndex, endIndex);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Blogs</h1>
      <div className="space-y-6">
        {currentPosts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="block">
            <article className="border rounded-lg p-6 hover:shadow-lg transition">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-semibold">{post.title}</h2>
              </div>
              <p className="text-gray-600 mb-2">{post.description}</p>
              <time className="text-sm text-gray-500">
                {new Date(post.date).toLocaleDateString("zh-CN")}
              </time>
            </article>
          </Link>
        ))}
      </div>

      {/* 分页导航 */}
      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-2">
          {/* Previous  */}
          {currentPage > 1 && (
            <Link
              href={`/blog?page=${currentPage - 1}`}
              className="px-4 py-2 rounded-lg border hover:bg-gray-100 transition"
            >
              ← Previous
            </Link>
          )}

          {/* 页码 */}
          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNum) => {
                // 显示逻辑：始终显示第一页和最后一页，当前页附近±2页
                const showPage =
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  Math.abs(pageNum - currentPage) <= 2;

                if (!showPage) {
                  // 显示省略号
                  if (
                    pageNum === currentPage - 3 ||
                    pageNum === currentPage + 3
                  ) {
                    return (
                      <span key={pageNum} className="px-3 py-2 text-gray-500">
                        ...
                      </span>
                    );
                  }
                  return null;
                }

                return (
                  <Link
                    key={pageNum}
                    href={`/blog?page=${pageNum}`}
                    className={`px-4 py-2 rounded-lg transition ${
                      pageNum === currentPage
                        ? "bg-blue-600 text-white font-semibold"
                        : "border hover:bg-gray-100"
                    }`}
                  >
                    {pageNum}
                  </Link>
                );
              },
            )}
          </div>

          {/* Next */}
          {currentPage < totalPages && (
            <Link
              href={`/blog?page=${currentPage + 1}`}
              className="px-4 py-2 rounded-lg border hover:bg-gray-100 transition"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
