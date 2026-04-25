import { redirect } from "next/navigation";
import { getBookByIdDB } from "@/lib/actions";
import RedirectToBookClient from "@/components/RedirectToBookClient";

// 动态渲染,不缓存
// export const dynamic = "force-dynamic";
// export const revalidate = 0;

export default async function RedirectToBookPage({
  params,
}: {
  params: Promise<{ id1: string; id2: string; title: string }>;
}) {
  const { id1, id2, title } = await params;
  const bookId = `${id1}_${id2}`;

  // 先检查数据库中是否存在该书(带缓存)
  const existingBook = await getBookByIdDB(bookId);

  if (existingBook) {
    // 如果数据库中存在,302 跳转到 /book/[id]
    redirect(`/book/${bookId}`);
  }

  // 如果数据库中不存在,渲染客户端组件来处理加载和添加逻辑
  return (
    <RedirectToBookClient id1={id1} id2={id2} title={title} bookId={bookId} />
  );
}
