import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import { booksD1 } from "@/lib/db/schema.d1";
import { desc, eq, asc, and, gte, lte, sql } from "drizzle-orm";
import { getPrimaryEntity } from "@/lib/nlp-utils";
import type {
  BooksRepository,
  ExploreBook,
  PaginatedBooks,
  RelatedBooksResult,
  AvailableDatesResult,
  DailyBooksResult,
  BookToTag,
  BookDownloadPayload,
  RecordBookResult,
  SitemapBook,
  UpdateBookRecord,
} from "@/lib/db/repository.types";

type D1Handle = NonNullable<Parameters<typeof drizzleD1>[0]>;

/**
 * 惰性获取 D1 连接。仅在 Cloudflare Worker 运行时（DB_DRIVER=d1）被调用。
 * getCloudflareContext 通过动态 import 引入，避免在非 Worker 环境执行其副作用。
 */
async function getDb() {
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const { env } = getCloudflareContext();
  const dbEnv = env as unknown as Record<string, unknown>;
  return drizzleD1(dbEnv.DB as D1Handle, { schema: { books: booksD1 } });
}

// ---- SQLite/D1 适配辅助 ----

function toDb(d: Date): string {
  // 'YYYY-MM-DD HH:MM:SS'（UTC），date()/比较/排序均友好
  return d.toISOString().replace("T", " ").slice(0, 19);
}

function fromDb(text: string | null): Date {
  if (!text) return new Date(0);
  return new Date(`${text.replace(" ", "T")}Z`);
}

function parseTags(t: string | null): string[] {
  if (!t) return [];
  try {
    const arr = JSON.parse(t);
    return Array.isArray(arr) ? (arr as string[]) : [];
  } catch {
    return [];
  }
}

interface D1BookRow {
  id: string;
  title: string;
  description: string | null;
  tags: string | null;
  thumbnail: string;
  pageCount: number;
  downloadCount: number;
  id1: string;
  id2: string;
}

function mapBook(b: D1BookRow): ExploreBook {
  return {
    id: b.id,
    title: b.title,
    description: b.description ?? undefined,
    tags: parseTags(b.tags),
    thumbnail: b.thumbnail,
    pageCount: b.pageCount,
    downloadCount: b.downloadCount,
    id1: b.id1,
    id2: b.id2,
  };
}

// tags 数组包含某标签（JSON1）
const tagContains = (tag: string) =>
  sql`EXISTS (SELECT 1 FROM json_each(${booksD1.tags}) WHERE json_each.value = ${tag})`;

// tags 为空（null / '' / '[]'）
const tagsEmpty = sql`(${booksD1.tags} IS NULL OR ${booksD1.tags} = '' OR json_array_length(${booksD1.tags}) = 0)`;

/**
 * Cloudflare D1 (SQLite) 实现。
 * 相对 Postgres 的差异：tags 存 JSON 文本、ILIKE→LIKE、数组包含→json_each、
 * timestamp→ISO 文本、时间戳读写时显式转换。
 */
export const d1BooksRepository: BooksRepository = {
  async getExploreBooks(): Promise<ExploreBook[]> {
    const db = await getDb();
    const results = await db
      .select()
      .from(booksD1)
      .orderBy(desc(booksD1.downloadCount))
      .limit(50)
      .all();
    return results.map(mapBook);
  },

  async getBooksPaginated(page = 1, pageSize = 12): Promise<PaginatedBooks> {
    const db = await getDb();
    const offset = (page - 1) * pageSize;
    const totalRow = await db
      .select({ count: sql<number>`count(*)` })
      .from(booksD1)
      .get();
    const total = Number(totalRow?.count ?? 0);

    const results = await db
      .select()
      .from(booksD1)
      .orderBy(desc(booksD1.createdAt))
      .limit(pageSize)
      .offset(offset)
      .all();

    return {
      books: results.map(mapBook),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  async getBookByIdDB(id: string): Promise<ExploreBook | null> {
    const db = await getDb();
    const result = await db
      .select()
      .from(booksD1)
      .where(eq(booksD1.id, id))
      .get();
    return result ? mapBook(result) : null;
  },

  async getRelatedBooks(
    title: string,
    currentBookId: string,
    limit = 4,
  ): Promise<RelatedBooksResult> {
    const db = await getDb();
    const primaryEntity = getPrimaryEntity(title);

    if (!primaryEntity) {
      const results = await db
        .select()
        .from(booksD1)
        .where(sql`${booksD1.id} != ${currentBookId}`)
        .orderBy(desc(booksD1.downloadCount))
        .limit(limit + 1)
        .all();
      const booksData = results.slice(0, limit).map(mapBook);
      return {
        books: booksData,
        total: booksData.length,
        hasMore: results.length > limit,
      };
    }

    const searchPattern = `%${primaryEntity}%`;
    const whereClause = sql`${booksD1.id} != ${currentBookId} AND ${booksD1.title} LIKE ${searchPattern}`;

    const totalRow = await db
      .select({ count: sql<number>`count(*)` })
      .from(booksD1)
      .where(whereClause)
      .get();
    const total = Number(totalRow?.count ?? 0);

    const results = await db
      .select()
      .from(booksD1)
      .where(whereClause)
      .orderBy(desc(booksD1.downloadCount))
      .limit(limit + 1)
      .all();

    return {
      books: results.slice(0, limit).map(mapBook),
      total,
      hasMore: results.length > limit,
    };
  },

  async getAllRelatedBooks(
    title: string,
    currentBookId: string,
    page = 1,
    pageSize = 24,
    sortBy: "name" | "downloads" = "name",
    sortOrder: "asc" | "desc" = "asc",
  ): Promise<PaginatedBooks> {
    const db = await getDb();
    const offset = (page - 1) * pageSize;
    const primaryEntity = getPrimaryEntity(title);
    const orderByColumn = sortBy === "name" ? booksD1.title : booksD1.downloadCount;
    const orderExpr =
      sortOrder === "asc" ? asc(orderByColumn) : desc(orderByColumn);

    const whereClause = primaryEntity
      ? sql`${booksD1.id} != ${currentBookId} AND ${booksD1.title} LIKE ${`%${primaryEntity}%`}`
      : sql`${booksD1.id} != ${currentBookId}`;

    const totalRow = await db
      .select({ count: sql<number>`count(*)` })
      .from(booksD1)
      .where(whereClause)
      .get();
    const total = Number(totalRow?.count ?? 0);

    const results = await db
      .select()
      .from(booksD1)
      .where(whereClause)
      .orderBy(orderExpr)
      .limit(pageSize)
      .offset(offset)
      .all();

    return {
      books: results.map(mapBook),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  async getBooksByTag(
    tag: string,
    page = 1,
    pageSize = 12,
  ): Promise<PaginatedBooks> {
    const db = await getDb();
    const offset = (page - 1) * pageSize;
    const whereClause = tagContains(tag);

    const totalRow = await db
      .select({ count: sql<number>`count(*)` })
      .from(booksD1)
      .where(whereClause)
      .get();
    const total = Number(totalRow?.count ?? 0);

    const results = await db
      .select()
      .from(booksD1)
      .where(whereClause)
      .orderBy(desc(booksD1.downloadCount))
      .limit(pageSize)
      .offset(offset)
      .all();

    return {
      books: results.map(mapBook),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  async getAvailableDates(): Promise<AvailableDatesResult> {
    const db = await getDb();
    const results = await db
      .select({ date: sql<string>`DATE(${booksD1.createdAt})` })
      .from(booksD1)
      .orderBy(desc(sql`DATE(${booksD1.createdAt})`))
      .all();
    const uniqueDates = Array.from(new Set(results.map((r) => r.date)));
    return { dates: uniqueDates };
  },

  async getBooksByDate(date: string): Promise<DailyBooksResult> {
    const db = await getDb();
    const results = await db
      .select()
      .from(booksD1)
      .where(sql`DATE(${booksD1.createdAt}) = ${date}`)
      .orderBy(desc(booksD1.createdAt))
      .all();

    return {
      date,
      books: results.map((b) => ({
        ...mapBook(b),
        createdAt: fromDb(b.createdAt),
      })),
    };
  },

  async recordBookDownload(
    payload: BookDownloadPayload,
  ): Promise<RecordBookResult> {
    const db = await getDb();
    const { id1, id2, title, thumbnail, pageCount, description, tags } = payload;
    const id = `${id1}_${id2}`;
    const now = toDb(new Date());

    const existing = await db
      .select()
      .from(booksD1)
      .where(eq(booksD1.id, id))
      .get();

    if (existing) {
      await db
        .update(booksD1)
        .set({
          downloadCount: sql`${booksD1.downloadCount} + 1`,
          updatedAt: now,
          ...(description ? { description } : {}),
          ...(tags ? { tags: JSON.stringify(tags) } : {}),
        })
        .where(eq(booksD1.id, id))
        .run();
      return { created: false };
    }

    await db
      .insert(booksD1)
      .values({
        id,
        id1,
        id2,
        title,
        thumbnail,
        pageCount,
        description: description ?? null,
        tags: JSON.stringify(tags || []),
        createdAt: now,
        updatedAt: now,
      })
      .run();
    return { created: true };
  },

  async getBooksCreatedBetween(
    start: Date,
    end: Date,
  ): Promise<UpdateBookRecord[]> {
    const db = await getDb();
    const records = await db
      .select()
      .from(booksD1)
      .where(and(gte(booksD1.createdAt, toDb(start)), lte(booksD1.createdAt, toDb(end))))
      .orderBy(desc(booksD1.createdAt))
      .all();
    return records.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      createdAt: fromDb(r.createdAt),
    }));
  },

  async countBooksCreatedBetween(start: Date, end: Date): Promise<number> {
    const db = await getDb();
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(booksD1)
      .where(
        and(gte(booksD1.createdAt, toDb(start)), lte(booksD1.createdAt, toDb(end))),
      )
      .get();
    return Number(result?.count ?? 0);
  },

  async getUntaggedBooks(options?: { limit?: number }): Promise<BookToTag[]> {
    const db = await getDb();
    const query = db
      .select({
        id: booksD1.id,
        title: booksD1.title,
        description: booksD1.description,
      })
      .from(booksD1)
      .where(tagsEmpty)
      .orderBy(asc(booksD1.createdAt));

    const limited = options?.limit ? query.limit(options.limit) : query;
    return await limited.all();
  },

  async tagBook(bookId: string, tags: string[]): Promise<void> {
    const db = await getDb();
    await db
      .update(booksD1)
      .set({ tags: JSON.stringify(tags), updatedAt: toDb(new Date()) })
      .where(eq(booksD1.id, bookId))
      .run();
  },

  async getSitemapBooks(limit: number): Promise<SitemapBook[]> {
    const db = await getDb();
    const allBooks = await db
      .select({ id: booksD1.id, updatedAt: booksD1.updatedAt })
      .from(booksD1)
      .orderBy(sql`${booksD1.downloadCount} DESC`)
      .limit(limit)
      .all();
    return allBooks.map((b) => ({ id: b.id, updatedAt: fromDb(b.updatedAt) }));
  },
};
