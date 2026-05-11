#!/usr/bin/env tsx

// 加载环境变量
import "dotenv/config";

import { db } from "@/lib/db";
import { books } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

async function checkTags() {
  console.log("🔍 检查数据库中的标签情况...\n");

  // 查询总书籍数
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(books);
  const totalBooks = totalResult[0]?.count || 0;

  console.log(`📚 总书籍数: ${totalBooks}`);

  // 查询有标签的书籍
  const taggedResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(books)
    .where(sql`cardinality(${books.tags}) > 0`);
  const taggedBooks = taggedResult[0]?.count || 0;

  console.log(`🏷️  有标签的书籍: ${taggedBooks}`);
  console.log(`❌ 无标签的书籍: ${totalBooks - taggedBooks}`);
  console.log(
    `\n📊 标签覆盖率: ${((taggedBooks / totalBooks) * 100).toFixed(2)}%`,
  );

  if (taggedBooks > 0) {
    // 显示一些有标签的书籍示例
    console.log("\n📖 有标签的书籍示例:");
    const sampleBooks = await db
      .select({
        id: books.id,
        title: books.title,
        tags: books.tags,
      })
      .from(books)
      .where(sql`cardinality(${books.tags}) > 0`)
      .limit(5);

    sampleBooks.forEach((book, i) => {
      console.log(`${i + 1}. ${book.title}`);
      console.log(`   标签: ${(book.tags as string[])?.join(", ") || "无"}`);
    });
  } else {
    console.log("\n⚠️  数据库中还没有任何书籍被分配标签!");
    console.log("💡 建议: 运行 'npm run tag-books' 来使用AI自动分析并添加标签");
  }
}

checkTags().catch(console.error);
