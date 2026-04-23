import { db } from "@/lib/db";
import { books } from "@/lib/db/schema";
import { desc, eq, count, like, or, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getPrimaryEntity } from "./nlp-utils";

export interface ExploreBook {
  id: string;
  title: string;
  thumbnail: string;
  pageCount: number;
  downloadCount: number;
  id1: string;
  id2: string;
}

export interface PaginatedBooks {
  books: ExploreBook[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const getExploreBooks = unstable_cache(
  async (): Promise<ExploreBook[]> => {
    try {
      const results = await db
        .select()
        .from(books)
        .orderBy(desc(books.downloadCount))
        .limit(50);
      return results.map((b) => ({
        id: b.id,
        title: b.title,
        thumbnail: b.thumbnail,
        pageCount: b.pageCount,
        downloadCount: b.downloadCount,
        id1: b.id1,
        id2: b.id2,
      }));
    } catch (error) {
      console.error("Error fetching explore books:", error);
      return [];
    }
  },
  ["explore-books"],
  { revalidate: 86400 }, // 24 hours
);

export const getBooksPaginated = unstable_cache(
  async (page: number = 1, pageSize: number = 12): Promise<PaginatedBooks> => {
    try {
      const offset = (page - 1) * pageSize;

      // Get total count
      const totalResult = await db.select({ count: count() }).from(books);
      const total = totalResult[0]?.count || 0;

      // Get paginated books
      const results = await db
        .select()
        .from(books)
        .orderBy(desc(books.createdAt))
        .limit(pageSize)
        .offset(offset);

      const booksData = results.map((b) => ({
        id: b.id,
        title: b.title,
        thumbnail: b.thumbnail,
        pageCount: b.pageCount,
        downloadCount: b.downloadCount,
        id1: b.id1,
        id2: b.id2,
      }));

      return {
        books: booksData,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      console.error("Error fetching paginated books:", error);
      return {
        books: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      };
    }
  },
  ["books-paginated"],
  { revalidate: 60 * 60 }, // 24 hours
);

export const getBookById = unstable_cache(
  async (id: string): Promise<ExploreBook | null> => {
    try {
      const result = await db.query.books.findFirst({
        where: eq(books.id, id),
      });

      if (!result) return null;

      return {
        id: result.id,
        title: result.title,
        thumbnail: result.thumbnail,
        pageCount: result.pageCount,
        downloadCount: result.downloadCount,
        id1: result.id1,
        id2: result.id2,
      };
    } catch (error) {
      console.error("Error fetching book by id:", error);
      return null;
    }
  },
  ["book-by-id"],
  { revalidate: 86400 }, // 1天缓存
);

export interface RelatedBooksResult {
  books: ExploreBook[];
  total: number;
  hasMore: boolean;
}

/**
 * 基于标题实体搜索相关书籍（带缓存）
 * @param title 当前书籍标题
 * @param currentBookId 当前书籍ID（用于排除）
 * @param limit 返回数量限制（默认4）
 */
export const getRelatedBooks = unstable_cache(
  async (
    title: string,
    currentBookId: string,
    limit: number = 4,
  ): Promise<RelatedBooksResult> => {
    try {
      // 使用NLP提取第一个主要实体
      const primaryEntity = getPrimaryEntity(title);

      if (!primaryEntity) {
        // 如果没有提取到实体，返回最近的书籍（按下载量）
        const results = await db
          .select()
          .from(books)
          .where(sql`${books.id} != ${currentBookId}`)
          .orderBy(desc(books.downloadCount))
          .limit(limit + 1); // 多取一个用于判断hasMore

        const booksData = results.slice(0, limit).map((b) => ({
          id: b.id,
          title: b.title,
          thumbnail: b.thumbnail,
          pageCount: b.pageCount,
          downloadCount: b.downloadCount,
          id1: b.id1,
          id2: b.id2,
        }));

        return {
          books: booksData,
          total: booksData.length,
          hasMore: results.length > limit,
        };
      }

      // 基于实体进行模糊搜索（使用ILIKE进行不区分大小写的匹配）
      const searchPattern = `%${primaryEntity}%`;

      // 获取总数（不包括当前书籍）
      const totalResult = await db
        .select({ count: count() })
        .from(books)
        .where(
          sql`${books.id} != ${currentBookId} AND ${books.title} ILIKE ${searchPattern}`,
        );

      const total = totalResult[0]?.count || 0;

      // 获取相关书籍（限制数量）
      const results = await db
        .select()
        .from(books)
        .where(
          sql`${books.id} != ${currentBookId} AND ${books.title} ILIKE ${searchPattern}`,
        )
        .orderBy(desc(books.downloadCount))
        .limit(limit + 1); // 多取一个用于判断hasMore

      const booksData = results.slice(0, limit).map((b) => ({
        id: b.id,
        title: b.title,
        thumbnail: b.thumbnail,
        pageCount: b.pageCount,
        downloadCount: b.downloadCount,
        id1: b.id1,
        id2: b.id2,
      }));

      return {
        books: booksData,
        total,
        hasMore: results.length > limit,
      };
    } catch (error) {
      console.error("Error fetching related books:", error);
      return {
        books: [],
        total: 0,
        hasMore: false,
      };
    }
  },
  ["related-books"],
  { revalidate: 86400 }, // 1天缓存
);

/**
 * 获取所有相关书籍（用于分页页面）（带缓存）
 * @param title 当前书籍标题
 * @param currentBookId 当前书籍ID（用于排除）
 * @param page 页码
 * @param pageSize 每页数量（默认24）
 */
export const getAllRelatedBooks = unstable_cache(
  async (
    title: string,
    currentBookId: string,
    page: number = 1,
    pageSize: number = 24,
  ): Promise<PaginatedBooks> => {
    try {
      const offset = (page - 1) * pageSize;

      // 使用NLP提取第一个主要实体
      const primaryEntity = getPrimaryEntity(title);

      if (!primaryEntity) {
        // 如果没有提取到实体，返回所有书籍（不包括当前书籍）
        const totalResult = await db
          .select({ count: count() })
          .from(books)
          .where(sql`${books.id} != ${currentBookId}`);

        const total = totalResult[0]?.count || 0;

        const results = await db
          .select()
          .from(books)
          .where(sql`${books.id} != ${currentBookId}`)
          .orderBy(desc(books.downloadCount))
          .limit(pageSize)
          .offset(offset);

        const booksData = results.map((b) => ({
          id: b.id,
          title: b.title,
          thumbnail: b.thumbnail,
          pageCount: b.pageCount,
          downloadCount: b.downloadCount,
          id1: b.id1,
          id2: b.id2,
        }));

        return {
          books: booksData,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        };
      }

      // 基于实体进行模糊搜索
      const searchPattern = `%${primaryEntity}%`;

      // 获取总数（不包括当前书籍）
      const totalResult = await db
        .select({ count: count() })
        .from(books)
        .where(
          sql`${books.id} != ${currentBookId} AND ${books.title} ILIKE ${searchPattern}`,
        );

      const total = totalResult[0]?.count || 0;

      // 获取分页的相关书籍
      const results = await db
        .select()
        .from(books)
        .where(
          sql`${books.id} != ${currentBookId} AND ${books.title} ILIKE ${searchPattern}`,
        )
        .orderBy(desc(books.downloadCount))
        .limit(pageSize)
        .offset(offset);

      const booksData = results.map((b) => ({
        id: b.id,
        title: b.title,
        thumbnail: b.thumbnail,
        pageCount: b.pageCount,
        downloadCount: b.downloadCount,
        id1: b.id1,
        id2: b.id2,
      }));

      return {
        books: booksData,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      console.error("Error fetching all related books:", error);
      return {
        books: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      };
    }
  },
  ["all-related-books"],
  { revalidate: 86400 }, // 1天缓存
);
