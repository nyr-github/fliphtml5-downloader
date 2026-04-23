import { db } from "@/lib/db";
import { books } from "@/lib/db/schema";
import { desc, eq, count } from "drizzle-orm";
import { unstable_cache } from "next/cache";

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

export async function getBookById(id: string): Promise<ExploreBook | null> {
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
}
