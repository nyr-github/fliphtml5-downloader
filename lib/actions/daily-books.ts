import { getBooksRepository } from "@/lib/db";
import { unstable_cache } from "next/cache";
import type {
  AvailableDatesResult,
  DailyBooksResult,
} from "@/lib/db/repository.types";

// 保持对外类型导出兼容
export type {
  AvailableDatesResult,
  DailyBooksResult,
} from "@/lib/db/repository.types";
export type { DailyBook } from "@/lib/db/repository.types";

/**
 * 获取所有有书籍的日期列表
 */
export const getAvailableDates = unstable_cache(
  async (): Promise<AvailableDatesResult> => {
    try {
      return await getBooksRepository().getAvailableDates();
    } catch (error) {
      console.error("Error fetching available dates:", error);
      return { dates: [] };
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
      return await getBooksRepository().getBooksByDate(date);
    } catch (error) {
      console.error("Error fetching books by date:", error);
      return { date, books: [] };
    }
  },
  ["books-by-date"],
  { revalidate: 3600 }, // 1 hour cache
);
