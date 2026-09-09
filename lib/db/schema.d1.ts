import {
  sqliteTable,
  text,
  integer,
  index,
  primaryKey,
} from "drizzle-orm/sqlite-core";

/**
 * Cloudflare D1 (SQLite) 版本的 books 表。
 *
 * 与 Postgres 版本 (schema.ts) 的差异：
 * - tags: Postgres 使用 varchar 数组，SQLite 无数组类型，这里以 JSON 文本存储；
 *   并且「无标签」统一存 NULL（不再用 '[]'），以便命中 books_untagged_idx 部分索引。
 * - created_at / updated_at: 使用 'YYYY-MM-DD HH:MM:SS'(UTC) 文本存储，
 *   字典序 == 时间序，范围查询可直接走 created_at 索引。
 *
 * 计量约束：D1 按 rows read 计费（免费额度 500 万行/天，本表 3.4 万行），
 * 因此这里声明的每个索引都对应 d1-repo.ts 中一条必须避免全表扫描的查询。
 * 完整索引/派生表/触发器定义以 drizzle/d1/0001_books_query_perf.sql 为准。
 */
export const booksD1 = sqliteTable(
  "books",
  {
    id: text("id").primaryKey(), // Using id1_id2 as unique identifier
    id1: text("id1").notNull(),
    id2: text("id2").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    tags: text("tags"), // JSON array string, e.g. '["Education","Business"]'; NULL = 未打标
    thumbnail: text("thumbnail").notNull(),
    pageCount: integer("page_count").notNull().default(0),
    downloadCount: integer("download_count").notNull().default(1),
    createdAt: text("created_at"), // ISO8601
    updatedAt: text("updated_at"), // ISO8601
  },
  (t) => [
    // 热门列表 / 探索页：ORDER BY download_count DESC LIMIT n 走索引前缀即停
    index("books_download_count_idx").on(t.downloadCount),
    // 分页列表、按日期范围查询（getBooksByDate / getBooksCreatedBetween）
    index("books_created_at_idx").on(t.createdAt),
    // sitemap 覆盖索引：只读索引即可拿到 (download_count, id, updated_at)，免回表
    index("books_dc_cover_idx").on(t.downloadCount, t.id, t.updatedAt),
    // books_untagged_idx (created_at) WHERE tags IS NULL —— 部分索引 drizzle 不支持，
    // 见迁移脚本；getUntaggedBooks 依赖它把「未打标」扫描成本收敛到 LIMIT 数量级。
  ]
);

export type BookD1Row = typeof booksD1.$inferSelect;
export type NewBookD1Row = typeof booksD1.$inferInsert;

/**
 * 标签倒排表（替代 `EXISTS (SELECT 1 FROM json_each(tags) ...)` 全表扫描）。
 *
 * 实际建表带 `WITHOUT ROWID`，并额外有 (tag, download_count DESC, book_id) 覆盖索引
 * （book_tags_tag_dc_idx）与 (book_id) 索引（book_tags_book_idx），
 * 使 /books/[tag] 的排序分页只读「分页大小」量级行。
 * 由迁移脚本中的触发器随 books 写入自动维护。
 */
export const bookTagsD1 = sqliteTable(
  "book_tags",
  {
    tag: text("tag").notNull(),
    bookId: text("book_id").notNull(),
    downloadCount: integer("download_count").notNull().default(1),
  },
  (t) => [
    primaryKey({ columns: [t.tag, t.bookId] }),
    index("book_tags_tag_dc_idx").on(t.tag, t.downloadCount, t.bookId),
    index("book_tags_book_idx").on(t.bookId),
  ]
);

/**
 * 收录日期清单（date -> 当天新书数）。
 *
 * 用于 getAvailableDates：只读「有书的天数」行（当前约 140 行），
 * 取代原先 `SELECT DATE(created_at) FROM books` 的 3.4 万行全表去重。
 */
export const bookDatesD1 = sqliteTable(
  "book_dates",
  {
    date: text("date").notNull(),
    bookCount: integer("book_count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.date] })]
);

/**
 * 精确计数器（key = 'total' 或 'tag:<标签名>'）。
 *
 * 用于分页/标签页的 total，取代 `count(*)` 全表/全索引扫描。
 */
export const bookStatsD1 = sqliteTable(
  "book_stats",
  {
    key: text("key").notNull(),
    value: integer("value").notNull(),
  },
  (t) => [primaryKey({ columns: [t.key] })]
);

/**
 * 标题全文索引：FTS5 虚拟表（trigram 分词，外部内容表指向 books.rowid）。
 *
 * drizzle 无法声明 virtual table，只存在于迁移脚本中；
 * d1-repo.ts 用 `rowid IN (SELECT rowid FROM books_title_fts WHERE books_title_fts MATCH ?)`
 * 命中它，语义与原先的 `title LIKE '%关键词%'` 完全一致（已用全量数据比对命中数）。
 */
export const BOOKS_TITLE_FTS_TABLE = "books_title_fts";
