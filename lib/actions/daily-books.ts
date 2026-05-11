import { db } from "@/lib/db";
import { books } from "@/lib/db/schema";
import { desc, sql, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export interface DailyBooks {
  date: string;
  books: {
    id: string;
    title: string;
    description?: string;
    tags?: string[];
    thumbnail: string;
    pageCount: number;
    downloadCount: number;
    id1: string;
    id2: string;
    createdAt: Date;
  }[];
}

export interface AvailableDatesResult {
  dates: string[];
}

export interface DailyBooksResult {
  date: string;
  books: DailyBooks["books"];
}

/**
 * 获取所有有书籍的日期列表
 */
export const getAvailableDates = unstable_cache(
  async (): Promise<AvailableDatesResult> => {
    try {
      const results = await db
        .select({
          date: sql<string>`DATE(${books.createdAt})`,
        })
        .from(books)
        .orderBy(desc(sql`DATE(${books.createdAt})`));

      // 去重并保持顺序
      const uniqueDates = Array.from(new Set(results.map((r) => r.date)));

      return {
        dates: uniqueDates,
      };
    } catch (error) {
      console.error("Error fetching available dates:", error);
      return {
        dates: [],
      };
    }
  },
  ["available-dates"],
  { revalidate: 3600 }, // 1 hour cache
);

/**
 * 获取指定日期的书籍列表
 */
export const getBooksByDate = unstable_cache(
  async (date: string): Promise<DailyBooksResult> => {
    try {
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
          ...b,
          description: b.description ?? undefined,
          tags: b.tags ?? [],
        })),
      };
    } catch (error) {
      console.error("Error fetching books by date:", error);
      return {
        date,
        books: [],
      };
    }
  },
  ["books-by-date"],
  { revalidate: 3600 }, // 1 hour cache
);
