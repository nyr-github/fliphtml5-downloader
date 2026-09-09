import { db } from "@/lib/db/postgres";
import { books } from "@/lib/db/schema";
import { desc, eq, count, sql, asc, gte, lte, and } from "drizzle-orm";
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

function mapBook(b: {
  id: string;
  title: string;
  description: string | null;
  tags: string[] | null;
  thumbnail: string;
  pageCount: number;
  downloadCount: number;
  id1: string;
  id2: string;
}): ExploreBook {
  return {
    id: b.id,
    title: b.title,
    description: b.description ?? undefined,
    tags: b.tags ?? [],
    thumbnail: b.thumbnail,
    pageCount: b.pageCount,
    downloadCount: b.downloadCount,
    id1: b.id1,
    id2: b.id2,
  };
}

/**
 * Postgres (postgres-js + Drizzle) 实现。
 * 逐字保留原有查询逻辑，确保 Vercel / VPS 行为不变。
 */
export const postgresBooksRepository: BooksRepository = {
  async getExploreBooks(): Promise<ExploreBook[]> {
    const results = await db
      .select()
      .from(books)
      .orderBy(desc(books.downloadCount))
      .limit(50);
    return results.map(mapBook);
  },

  async getBooksPaginated(
    page = 1,
    pageSize = 12,
  ): Promise<PaginatedBooks> {
    const offset = (page - 1) * pageSize;
    const totalResult = await db.select({ count: count() }).from(books);
    const total = totalResult[0]?.count || 0;

    const results = await db
      .select()
      .from(books)
      .orderBy(desc(books.createdAt))
      .limit(pageSize)
      .offset(offset);

    return {
      books: results.map(mapBook),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  async getBookByIdDB(id: string): Promise<ExploreBook | null> {
    const result = await db.query.books.findFirst({
      where: eq(books.id, id),
    });
    if (!result) return null;
    return mapBook(result);
  },

  async getRelatedBooks(
    title: string,
    currentBookId: string,
    limit = 4,
  ): Promise<RelatedBooksResult> {
    const primaryEntity = getPrimaryEntity(title);

    if (!primaryEntity) {
      const results = await db
        .select()
        .from(books)
        .where(sql`${books.id} != ${currentBookId}`)
        .orderBy(desc(books.downloadCount))
        .limit(limit + 1);
      const booksData = results.slice(0, limit).map(mapBook);
      return { books: booksData, total: booksData.length, hasMore: results.length > limit };
    }

    const searchPattern = `%${primaryEntity}%`;
    const totalResult = await db
      .select({ count: count() })
      .from(books)
      .where(
        sql`${books.id} != ${currentBookId} AND ${books.title} ILIKE ${searchPattern}`,
      );
    const total = totalResult[0]?.count || 0;

    const results = await db
      .select()
      .from(books)
      .where(
        sql`${books.id} != ${currentBookId} AND ${books.title} ILIKE ${searchPattern}`,
      )
      .orderBy(desc(books.downloadCount))
      .limit(limit + 1);

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
    const offset = (page - 1) * pageSize;
    const primaryEntity = getPrimaryEntity(title);
    const orderByColumn = sortBy === "name" ? books.title : books.downloadCount;
    const orderByDirection = sortOrder === "asc" ? "asc" : "desc";

    if (!primaryEntity) {
      const totalResult = await db
        .select({ count: count() })
        .from(books)
        .where(sql`${books.id} != ${currentBookId}`);
      const total = totalResult[0]?.count || 0;

      const results = await db
        .select()
        .from(books)
        .where(sql`${books.id} != ${currentBookId}`)
        .orderBy(
          orderByDirection === "asc" ? asc(orderByColumn) : desc(orderByColumn),
        )
        .limit(pageSize)
        .offset(offset);

      return {
        books: results.map(mapBook),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }

    const searchPattern = `%${primaryEntity}%`;
    const totalResult = await db
      .select({ count: count() })
      .from(books)
      .where(
        sql`${books.id} != ${currentBookId} AND ${books.title} ILIKE ${searchPattern}`,
      );
    const total = totalResult[0]?.count || 0;

    const results = await db
      .select()
      .from(books)
      .where(
        sql`${books.id} != ${currentBookId} AND ${books.title} ILIKE ${searchPattern}`,
      )
      .orderBy(
        orderByDirection === "asc" ? asc(orderByColumn) : desc(orderByColumn),
      )
      .limit(pageSize)
      .offset(offset);

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
    const offset = (page - 1) * pageSize;

    const totalResult = await db
      .select({ count: count() })
      .from(books)
      .where(sql`${books.tags} @> ARRAY[${tag}]::varchar[]`);
    const total = totalResult[0]?.count || 0;

    const results = await db
      .select()
      .from(books)
      .where(sql`${books.tags} @> ARRAY[${tag}]::varchar[]`)
      .orderBy(desc(books.downloadCount))
      .limit(pageSize)
      .offset(offset);

    return {
      books: results.map(mapBook),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  async getAvailableDates(): Promise<AvailableDatesResult> {
    const results = await db
      .select({ date: sql<string>`DATE(${books.createdAt})` })
      .from(books)
      .orderBy(desc(sql`DATE(${books.createdAt})`));
    const uniqueDates = Array.from(new Set(results.map((r) => r.date)));
    return { dates: uniqueDates };
  },

  async getBooksByDate(date: string): Promise<DailyBooksResult> {
    const results = await db
      .select({
        id: books.id,
        title: books.title,
        description: books.description,
        tags: books.tags,
        thumbnail: books.thumbnail,
        pageCount: books.pageCount,
        downloadCount: books.downloadCount,
        id1: books.id1,
        id2: books.id2,
        createdAt: books.createdAt,
      })
      .from(books)
      .where(sql`DATE(${books.createdAt}) = ${date}`)
      .orderBy(desc(books.createdAt));

    return {
      date,
      books: results.map((b) => ({
        ...mapBook(b),
        createdAt: b.createdAt,
      })),
    };
  },

  async recordBookDownload(
    payload: BookDownloadPayload,
  ): Promise<RecordBookResult> {
    const { id1, id2, title, thumbnail, pageCount, description, tags } = payload;
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
          ...(description && { description }),
          ...(tags && { tags }),
        })
        .where(eq(books.id, id));
      return { created: false };
    }

    await db.insert(books).values({
      id,
      id1,
      id2,
      title,
      thumbnail,
      pageCount,
      description,
      tags: tags || [],
    });
    return { created: true };
  },

  async getBooksCreatedBetween(
    start: Date,
    end: Date,
  ): Promise<UpdateBookRecord[]> {
    const records = await db
      .select()
      .from(books)
      .where(and(gte(books.createdAt, start), lte(books.createdAt, end)))
      .orderBy(desc(books.createdAt));
    return records.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      createdAt: r.createdAt,
    }));
  },

  async countBooksCreatedBetween(start: Date, end: Date): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(books)
      .where(
        sql`${books.createdAt} >= ${start.toISOString()} AND ${books.createdAt} <= ${end.toISOString()}`,
      );
    return result[0]?.count || 0;
  },

  async getUntaggedBooks(options?: { limit?: number }): Promise<BookToTag[]> {
    const baseQuery = db
      .select({
        id: books.id,
        title: books.title,
        description: books.description,
      })
      .from(books)
      .where(sql`cardinality(${books.tags}) = 0 OR ${books.tags} IS NULL`)
      .orderBy(asc(books.createdAt));

    const query = options?.limit ? baseQuery.limit(options.limit) : baseQuery;
    return await query;
  },

  async tagBook(bookId: string, tags: string[]): Promise<void> {
    await db
      .update(books)
      .set({ tags, updatedAt: new Date() })
      .where(eq(books.id, bookId));
  },

  async getSitemapBooks(limit: number): Promise<SitemapBook[]> {
    const allBooks = await db
      .select({ id: books.id, updatedAt: books.updatedAt })
      .from(books)
      .orderBy(sql`${books.downloadCount} DESC`)
      .limit(limit);
    return allBooks.map((b) => ({ id: b.id, updatedAt: b.updatedAt }));
  },
};
