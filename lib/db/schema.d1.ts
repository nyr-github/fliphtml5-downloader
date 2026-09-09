import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * Cloudflare D1 (SQLite) 版本的 books 表。
 *
 * 与 Postgres 版本 (schema.ts) 的差异：
 * - tags: Postgres 使用 varchar 数组，SQLite 无数组类型，这里以 JSON 文本存储。
 * - created_at / updated_at: 使用 ISO8601 文本存储，保证字典序 == 时间序。
 */
export const booksD1 = sqliteTable("books", {
  id: text("id").primaryKey(), // Using id1_id2 as unique identifier
  id1: text("id1").notNull(),
  id2: text("id2").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  tags: text("tags"), // JSON array string, e.g. '["Education","Business"]'
  thumbnail: text("thumbnail").notNull(),
  pageCount: integer("page_count").notNull().default(0),
  downloadCount: integer("download_count").notNull().default(1),
  createdAt: text("created_at"), // ISO8601
  updatedAt: text("updated_at"), // ISO8601
});

export type BookD1Row = typeof booksD1.$inferSelect;
export type NewBookD1Row = typeof booksD1.$inferInsert;
