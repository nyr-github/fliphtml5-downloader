import { NextResponse } from "next/server";
import { getBooksRepository } from "@/lib/db";
import { submitBookToSearchEngine } from "@/lib/seo";
import { revalidateBookCache } from "@/lib/actions";

export async function POST(req: Request) {
  try {
    const { id1, id2, title, thumbnail, pageCount, description, tags } =
      await req.json();

    const { created } = await getBooksRepository().recordBookDownload({
      id1,
      id2,
      title,
      thumbnail,
      pageCount,
      description,
      tags,
    });

    if (created) {
      // 提交新书籍到搜索引擎进行SEO索引
      submitBookToSearchEngine(id1, id2, title).catch((err: unknown) => {
        console.error("Failed to submit to search engine:", err);
      });
    }

    // 清理该书籍的缓存，确保下次访问时获取最新数据
    await revalidateBookCache(`${id1}_${id2}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error recording download:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
