import { getBooksRepository } from "@/lib/db";
import { unstable_cache } from "next/cache";
import type {
  ExploreBook,
  PaginatedBooks,
  RelatedBooksResult,
} from "@/lib/db/repository.types";

// 保持对外类型导出兼容（components 从 "@/lib/actions" 导入 ExploreBook 等）
export type {
  ExploreBook,
  PaginatedBooks,
  RelatedBooksResult,
} from "@/lib/db/repository.types";

export const getExploreBooks = unstable_cache(
  async (): Promise<ExploreBook[]> => {
    try {
      return await getBooksRepository().getExploreBooks();
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
      return await getBooksRepository().getBooksPaginated(page, pageSize);
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

/**
 * 从数据库获取单个书籍（无缓存）
 * @param id 书籍ID
 */
export async function getBookByIdDB(id: string): Promise<ExploreBook | null> {
  try {
    return await getBooksRepository().getBookByIdDB(id);
  } catch (error) {
    console.error("Error fetching book by id:", error);
    return null;
  }
}

/**
 * 获取单个书籍（带缓存）
 * 缓存key包含书籍ID，以便在创建/更新时可以针对性清理
 */
export function getBookById(id: string) {
  return unstable_cache(
    async (): Promise<ExploreBook | null> => {
      return getBookByIdDB(id);
    },
    [`book-by-id-${id}`], // 缓存key包含书籍ID
    { revalidate: 86400 }, // 1天缓存
  )();
}

/**
 * 清理特定书籍的缓存
 * @param id 书籍ID
 */
export async function revalidateBookCache(id: string) {
  const { revalidateTag } = await import("next/cache");
  revalidateTag(`book-by-id-${id}`);
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
      return await getBooksRepository().getRelatedBooks(
        title,
        currentBookId,
        limit,
      );
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
    sortBy: "name" | "downloads" = "name",
    sortOrder: "asc" | "desc" = "asc",
  ): Promise<PaginatedBooks> => {
    try {
      return await getBooksRepository().getAllRelatedBooks(
        title,
        currentBookId,
        page,
        pageSize,
        sortBy,
        sortOrder,
      );
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

// 按标签查询书籍
export const getBooksByTag = unstable_cache(
  async (
    tag: string,
    page: number = 1,
    pageSize: number = 12,
  ): Promise<PaginatedBooks> => {
    try {
      return await getBooksRepository().getBooksByTag(tag, page, pageSize);
    } catch (error) {
      console.error("Error fetching books by tag:", error);
      return {
        books: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      };
    }
  },
  ["books-by-tag"],
  { revalidate: 86400 }, // 24 hours
);
