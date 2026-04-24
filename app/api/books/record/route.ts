import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { books } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { submitToSearchEngine } from "@/lib/seo";

export async function POST(req: Request) {
  try {
    const { id1, id2, title, thumbnail, pageCount } = await req.json();
    const id = `${id1}_${id2}`;

    const existing = await db.query.books.findFirst({
      where: eq(books.id, id),
    });

    if (existing) {
      await db
        .update(books)
        .set({
          downloadCount: sql`${books.downloadCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(books.id, id));
    } else {
      await db.insert(books).values({
        id,
        id1,
        id2,
        title,
        thumbnail,
        pageCount,
      });

      // 提交新书籍到搜索引擎进行SEO索引
      submitToSearchEngine(id1, id2, title).catch((err: unknown) => {
        console.error("Failed to submit to search engine:", err);
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error recording download:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
