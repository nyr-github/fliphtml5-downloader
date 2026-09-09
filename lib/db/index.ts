import type { BooksRepository } from "@/lib/db/repository.types";
import { postgresBooksRepository } from "@/lib/db/repositories/postgres-repo";
import { d1BooksRepository } from "@/lib/db/repositories/d1-repo";

/**
 * 数据仓储工厂。
 *
 * 运行时按 DB_DRIVER 选择后端：
 * - 未设置或非 "d1"（Vercel / VPS / 本地脚本）→ Postgres (postgres-js)
 * - "d1"（Cloudflare Workers，由 wrangler vars 注入）→ Cloudflare D1 (SQLite)
 *
 * 两个模块的 import 均不会触发实际连接（Postgres 采用惰性单例，
 * D1 仅在方法内部惰性获取绑定），因此在任一平台上安全 import 本文件。
 */
export function getBooksRepository(): BooksRepository {
  if (process.env.DB_DRIVER === "d1") {
    return d1BooksRepository;
  }
  return postgresBooksRepository;
}

export * from "@/lib/db/repository.types";
