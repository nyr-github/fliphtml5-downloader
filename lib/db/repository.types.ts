/**
 * 数据仓储层共享类型（DTO）。
 *
 * 说明：这些类型是 Postgres 与 D1 两套实现共同遵守的对外数据结构，
 * 时间字段统一为 Date，tags 统一为 string[]，屏蔽底层方言差异。
 */

export interface ExploreBook {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
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

export interface RelatedBooksResult {
  books: ExploreBook[];
  total: number;
  hasMore: boolean;
}

export interface AvailableDatesResult {
  dates: string[];
}

export interface DailyBook extends ExploreBook {
  createdAt: Date;
}

export interface DailyBooksResult {
  date: string;
  books: DailyBook[];
}

export interface BookToTag {
  id: string;
  title: string;
  description: string | null;
}

export interface BookDownloadPayload {
  id1: string;
  id2: string;
  title: string;
  thumbnail: string;
  pageCount: number;
  description?: string;
  tags?: string[];
}

/** recordBookDownload 返回是否为首次收录（用于决定是否提交 SEO） */
export interface RecordBookResult {
  created: boolean;
}

export interface SitemapBook {
  id: string;
  updatedAt: Date;
}

/** updates 路由需要的精简记录 */
export interface UpdateBookRecord {
  id: string;
  title: string;
  description: string | null;
  createdAt: Date;
}

/**
 * 统一的数据访问接口。Postgres 与 D1 各实现一份。
 */
export interface BooksRepository {
  getExploreBooks(): Promise<ExploreBook[]>;
  getBooksPaginated(page?: number, pageSize?: number): Promise<PaginatedBooks>;
  getBookByIdDB(id: string): Promise<ExploreBook | null>;
  getRelatedBooks(
    title: string,
    currentBookId: string,
    limit?: number,
  ): Promise<RelatedBooksResult>;
  getAllRelatedBooks(
    title: string,
    currentBookId: string,
    page?: number,
    pageSize?: number,
    sortBy?: "name" | "downloads",
    sortOrder?: "asc" | "desc",
  ): Promise<PaginatedBooks>;
  getBooksByTag(
    tag: string,
    page?: number,
    pageSize?: number,
  ): Promise<PaginatedBooks>;
  getAvailableDates(): Promise<AvailableDatesResult>;
  getBooksByDate(date: string): Promise<DailyBooksResult>;
  recordBookDownload(payload: BookDownloadPayload): Promise<RecordBookResult>;
  getBooksCreatedBetween(start: Date, end: Date): Promise<UpdateBookRecord[]>;
  countBooksCreatedBetween(start: Date, end: Date): Promise<number>;
  getUntaggedBooks(options?: { limit?: number }): Promise<BookToTag[]>;
  tagBook(bookId: string, tags: string[]): Promise<void>;
  getSitemapBooks(limit: number): Promise<SitemapBook[]>;
}
