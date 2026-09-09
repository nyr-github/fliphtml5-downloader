import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Supabase / Neon PostgreSQL 连接（惰性单例）。
 *
 * 采用惰性创建，避免在 Cloudflare Worker 运行时 import 本模块即触发
 * postgres() 建连（Worker 无 TCP，且 DATABASE_URL 不存在）。
 * 仅当 DB_DRIVER 未设置为 d1 时（Vercel / VPS）才会真正初始化。
 */
function createDb() {
    const client = postgres(process.env.DATABASE_URL!, { prepare: false });
    return drizzle(client, { schema });
}

type Db = ReturnType<typeof createDb>;

let _db: Db | undefined;

export function getDb(): Db {
    if (!_db) {
        _db = createDb();
    }
    return _db;
}

// 兼容旧的 `import { db } from "@/lib/db/postgres"` 写法（Node 脚本/VPS 场景）。
// 通过 Proxy 延迟到首次属性访问时才建连，保持类型（含 .query.books）完整。
export const db: Db = new Proxy({} as Db, {
    get(_target, prop, receiver) {
        return Reflect.get(getDb() as object, prop, receiver);
    },
});

export { schema };
