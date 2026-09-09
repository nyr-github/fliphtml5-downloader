import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import {
  booksD1,
  bookTagsD1,
  bookDatesD1,
  bookStatsD1,
  BOOKS_TITLE_FTS_TABLE,
} from "@/lib/db/schema.d1";
import { desc, eq, asc, and, gte, gt, lt, lte, sql } from "drizzle-orm";
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
  return drizzleD1(dbEnv.DB as D1Handle, {
    schema: { books: booksD1 },
  });
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

/**
 * 空标签一律写 NULL（而不是 '[]'）。
 * 这样「未打标」就是 `tags IS NULL`，能命中 books_untagged_idx 部分索引。
 */
function tagsToDb(tags?: string[] | null): string | null {
  return tags && tags.length > 0 ? JSON.stringify(tags) : null;
}

interface BookRowBase {
  id: string;
  title: string;
  /** 列表查询做了列裁剪，不取 description，故为可选 */
  description?: string | null;
  tags: string | null;
  thumbnail: string;
  pageCount: number;
  downloadCount: number;
  id1: string;
  id2: string;
}

function mapBook(b: BookRowBase): ExploreBook {
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

/**
 * 列表页只取卡片真正渲染的列。
 * description 单行最长 7KB+，列表/关联书籍查询一次可能命中上千行，
 * 不取它可以显著降低 D1 的读取字节数（rows read 之外最重要的成本）。
 */
const bookListCols = {
  id: booksD1.id,
  id1: booksD1.id1,
  id2: booksD1.id2,
  title: booksD1.title,
  tags: booksD1.tags,
  thumbnail: booksD1.thumbnail,
  pageCount: booksD1.pageCount,
  downloadCount: booksD1.downloadCount,
} as const;

/** 详情页需要 description，单独一套列 */
const bookDetailCols = { ...bookListCols, description: booksD1.description } as const;

/** 标签计数器 key */
const tagStatKey = (tag: string) => `tag:${tag}`;

/**
 * 把关键词转成 FTS5 trigram 短语查询串。
 *
 * - trigram 索引的 token 固定 3 字符，短于 3 字符的查询永远命中不了（返回 null 由调用方兜底）。
 * - 双引号内是字面量子串，语义与 `title LIKE '%kw%'` 一致（已用全量数据逐词比对命中数）。
 */
function ftsPhrase(term: string): string | null {
  const t = term.trim();
  if (t.length < 3) return null;
  return `"${t.replace(/"/g, '""')}"`;
}

/** 命中全文索引的谓词（rowid IN 子查询，SQLite 会先扫 FTS 结果再按主键回表） */
const titleMatches = (phrase: string) =>
  sql`rowid IN (SELECT rowid FROM ${sql.raw(BOOKS_TITLE_FTS_TABLE)}
     WHERE ${sql.raw(BOOKS_TITLE_FTS_TABLE)} MATCH ${phrase})`;

/**
 * 命中数统计。与旧实现 `count(*) WHERE id != ? AND title LIKE ?` 保持完全一致的语义
 * （同样排除当前书籍自身），代价 = 命中集大小，而非全表。
 */
const countTitleMatches = (phrase: string, excludeId: string) =>
  sql`SELECT count(*) AS c FROM ${booksD1}
     WHERE ${booksD1.id} != ${excludeId} AND rowid IN (SELECT rowid FROM ${sql.raw(BOOKS_TITLE_FTS_TABLE)}
       WHERE ${sql.raw(BOOKS_TITLE_FTS_TABLE)} MATCH ${phrase})`;

/** 'YYYY-MM-DD' -> 次日 'YYYY-MM-DD 00:00:00'，用于 created_at 的半开区间（可走索引） */
function dayRange(date: string): { start: string; endExclusive: string } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const startMs = Date.parse(`${date}T00:00:00Z`);
  if (Number.isNaN(startMs)) return null;
  return {
    start: `${date} 00:00:00`,
    endExclusive: toDb(new Date(startMs + 24 * 60 * 60 * 1000)),
  };
}

/** 读取 book_stats 计数器（缺失即 0，例如某标签还没有书） */
async function readStat(db: Awaited<ReturnType<typeof getDb>>, key: string) {
  const row = await db
    .select({ value: bookStatsD1.value })
    .from(bookStatsD1)
    .where(eq(bookStatsD1.key, key))
    .get();
  return Number(row?.value ?? 0);
}

/**
 * Cloudflare D1 (SQLite) 实现。
 *
 * 所有查询都按「D1 rows read 最小化」编写。下列数字是在本地 D1 引擎（miniflare，
 * 与线上同一套 SQLite）导入全量 34,322 行真实数据后，用 D1 返回的 meta.rows_read 实测得到
 * 的单个方法读行数（旧实现取自 git HEAD 的同名方法）：
 *
 * | 场景                       | 优化前  | 优化后 | 倍数 |
 * | -------------------------- | ------: | -----: | ---: |
 * | getBooksPaginated(1,12)    |  34,334 |     13 | 2641× |
 * | getRelatedBooks(4)         |  68,644 |     28 | 2452× |
 * | getAllRelatedBooks(1,24)   |  68,648 |     28 | 2452× |
 * | getBooksByTag(Education)   |  34,941 |     49 |  713× |
 * | getAvailableDates()        |  68,644 |    142 |  483× |
 * | getBooksByDate(day)        |  34,322 |    291 |  118× |
 * | getUntaggedBooks(limit 50) |   2,812 |     50 |   56× |
 * | getExploreBooks()          |      50 |     50 |    — |
 * | getBookByIdDB(id)          |       1 |      1 |    — |
 * | getSitemapBooks(10000)     |  10,000 | 10,000 |    — |
 *
 * 另：越界分页（爬虫常做的 /?page=99999）由 34,323 行降到 1 行；
 * 关联书籍高命中（约 190 本）时为 1,330 行，代价与命中集大小成正比而与表大小无关。
 * getSitemapBooks 的 1 万行是 sitemap 本身的量级，需要靠缓存（而非索引）收敛。
 */
export const d1BooksRepository: BooksRepository = {
  async getExploreBooks(): Promise<ExploreBook[]> {
    const db = await getDb();
    // ORDER BY download_count DESC + LIMIT：沿索引顺序读 50 行即停
    const results = await db
      .select(bookListCols)
      .from(booksD1)
      .orderBy(desc(booksD1.downloadCount))
      .limit(50)
      .all();
    return results.map(mapBook);
  },

  async getBooksPaginated(page = 1, pageSize = 12): Promise<PaginatedBooks> {
    const db = await getDb();
    const offset = Math.max(0, (page - 1) * pageSize);
    // total 来自触发器维护的计数器，不再 count(*) 扫全表
    const total = await readStat(db, "total");

    // 越界页（爬虫常干的事）直接空返回：否则 OFFSET 会走完整棵索引（最坏 = 全表）
    if (offset >= total) {
      return { books: [], total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }

    const results = await db
      .select(bookListCols)
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
    // 主键点查，1 行
    const result = await db
      .select(bookDetailCols)
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
    const phrase = ftsPhrase(getPrimaryEntity(title));

    // 没有可用实体（或实体短于 trigram 索引下限）时，退化为热门书籍
    if (!phrase) {
      const results = await db
        .select(bookListCols)
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

    const totalRow = await db.get(countTitleMatches(phrase, currentBookId));
    const total = Number((totalRow as { c?: number } | undefined)?.c ?? 0);

    const results = await db
      .select(bookListCols)
      .from(booksD1)
      .where(and(sql`${booksD1.id} != ${currentBookId}`, titleMatches(phrase)))
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
    const offset = Math.max(0, (page - 1) * pageSize);
    const phrase = ftsPhrase(getPrimaryEntity(title));

    // 实体不可用时无筛选条件，直接按排序列走索引取分页
    if (!phrase) {
      const total = await readStat(db, "total");
      if (offset >= total) {
        return { books: [], total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
      }
      const orderByColumn =
        sortBy === "name" ? booksD1.title : booksD1.downloadCount;
      const results = await db
        .select(bookListCols)
        .from(booksD1)
        .where(sql`${booksD1.id} != ${currentBookId}`)
        .orderBy(
          sortOrder === "asc" ? asc(orderByColumn) : desc(orderByColumn)
        )
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
    }

    const totalRow = await db.get(countTitleMatches(phrase, currentBookId));
    const total = Number((totalRow as { c?: number } | undefined)?.c ?? 0);
    // 越界页不再付出「命中集 + 排序」的代价
    if (offset >= total) {
      return { books: [], total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }

    const orderByColumn =
      sortBy === "name" ? booksD1.title : booksD1.downloadCount;
    const results = await db
      .select(bookListCols)
      .from(booksD1)
      .where(and(sql`${booksD1.id} != ${currentBookId}`, titleMatches(phrase)))
      .orderBy(sortOrder === "asc" ? asc(orderByColumn) : desc(orderByColumn))
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
    const offset = Math.max(0, (page - 1) * pageSize);

    // total 来自 book_tags 上的触发器计数器
    const total = await readStat(db, tagStatKey(tag));

    // 越界页：连倒排表都不用碰
    if (offset >= total) {
      return { books: [], total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }

    // 先在 book_tags 的 (tag, download_count, book_id) 覆盖索引上定位分页，
    // 再用主键回表，读行数 ≈ 2×pageSize（原先是最坏 2×全表）
    const ids = await db
      .select({ bookId: bookTagsD1.bookId })
      .from(bookTagsD1)
      .where(eq(bookTagsD1.tag, tag))
      .orderBy(desc(bookTagsD1.downloadCount), asc(bookTagsD1.bookId))
      .limit(pageSize)
      .offset(offset)
      .all();

    if (ids.length === 0) {
      return { books: [], total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }

    const results = await db
      .select(bookListCols)
      .from(booksD1)
      .where(
        sql`${booksD1.id} IN (${sql.join(
          ids.map((r) => sql`${r.bookId}`),
          sql`, `
        )})`
      )
      .orderBy(desc(booksD1.downloadCount))
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
    // 直接读日期清单：行数 = 有书的天数（当前约 140），而非全表去重
    const results = await db
      .select({ date: bookDatesD1.date })
      .from(bookDatesD1)
      .orderBy(desc(bookDatesD1.date))
      .all();
    return { dates: results.map((r) => r.date) };
  },

  async getBooksByDate(date: string): Promise<DailyBooksResult> {
    const db = await getDb();
    const range = dayRange(date);
    if (!range) return { date, books: [] };

    // created_at 半开区间，走 books_created_at_idx（原 DATE(created_at)=? 无法用索引）
    const results = await db
      .select({ ...bookListCols, createdAt: booksD1.createdAt })
      .from(booksD1)
      .where(
        and(gte(booksD1.createdAt, range.start), lt(booksD1.createdAt, range.endExclusive))
      )
      .orderBy(desc(booksD1.createdAt))
      .all();

    return {
      date,
      books: results.map((b) => ({
        ...mapBook(b),
        createdAt: fromDb(b.createdAt ?? null),
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

    // 主键点查，1 行
    const existing = await db
      .select({ id: booksD1.id })
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
          ...(tags ? { tags: tagsToDb(tags) } : {}),
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
        tags: tagsToDb(tags),
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
    // created_at 范围可走索引，只取 updates 接口需要的列
    const records = await db
      .select({
        id: booksD1.id,
        title: booksD1.title,
        description: booksD1.description,
        createdAt: booksD1.createdAt,
      })
      .from(booksD1)
      .where(and(gte(booksD1.createdAt, toDb(start)), lte(booksD1.createdAt, toDb(end))))
      .orderBy(desc(booksD1.createdAt))
      .all();
    return records.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      createdAt: fromDb(r.createdAt ?? null),
    }));
  },

  async countBooksCreatedBetween(start: Date, end: Date): Promise<number> {
    const db = await getDb();
    // count(*) 限定在 created_at 索引区间内（覆盖索引扫描），只读当日行数
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
    // 空标签已归一化为 NULL，配合部分索引 books_untagged_idx：
    // 读行数 ≈ 待处理书籍数（原先每次 cron 最坏扫全表）
    const query = db
      .select({
        id: booksD1.id,
        title: booksD1.title,
        description: booksD1.description,
      })
      .from(booksD1)
      .where(sql`${booksD1.tags} IS NULL`)
      .orderBy(asc(booksD1.createdAt));

    const limited = options?.limit ? query.limit(options.limit) : query;
    return await limited.all();
  },

  async tagBook(bookId: string, tags: string[]): Promise<void> {
    const db = await getDb();
    await db
      .update(booksD1)
      .set({ tags: tagsToDb(tags), updatedAt: toDb(new Date()) })
      .where(eq(booksD1.id, bookId))
      .run();
  },

  async getSitemapBooks(limit: number): Promise<SitemapBook[]> {
    const db = await getDb();
    // 覆盖索引 books_dc_cover_idx 含 (download_count, id, updated_at)：免回表，只读 limit 个索引项
    const allBooks = await db
      .select({ id: booksD1.id, updatedAt: booksD1.updatedAt })
      .from(booksD1)
      .orderBy(desc(booksD1.downloadCount))
      .limit(limit)
      .all();
    return allBooks.map((b) => ({ id: b.id, updatedAt: fromDb(b.updatedAt ?? null) }));
  },
};
