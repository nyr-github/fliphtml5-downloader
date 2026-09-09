-- Cloudflare D1 (SQLite) 建表脚本
-- 对应 lib/db/schema.d1.ts。应用: pnpm exec wrangler d1 migrations apply <DB_NAME> --local|--remote
CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY,
  id1 TEXT NOT NULL,
  id2 TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT,
  thumbnail TEXT NOT NULL,
  page_count INTEGER NOT NULL DEFAULT 0,
  download_count INTEGER NOT NULL DEFAULT 1,
  created_at TEXT,
  updated_at TEXT
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS books_download_count_idx ON books (download_count);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS books_created_at_idx ON books (created_at);
