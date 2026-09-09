-- Cloudflare D1 (SQLite) 性能迁移：把 books 表的所有访问收敛到索引可命中的范围。
--
-- 背景：D1 按「rows read」计量（免费额度 5,000,000 行/天）。本表约 3.4 万行，
-- 优化前 /book/[id]（title LIKE '%kw%' 两次全表扫描）、/books/[tag]（EXISTS(json_each)
-- 两次全表扫描）、/books/date（DATE(created_at) 全表扫描）等单请求就要读 3~7 万行，
-- 数十次请求即可打满日额度。
--
-- 本迁移新增：
--   1. books_title_fts   —— FTS5 trigram 外部内容索引，等价替换 title LIKE '%kw%'（语义完全一致）
--   2. book_tags         —— 标签倒排表（tag, book_id, download_count），替代 json_each 扫描
--   3. book_dates        —— 收录日期清单，替代 DATE(created_at) 全表去重
--   4. book_stats        —— 精确计数器（总书数 / 每标签书数），替代 count(*) 全表扫描
--   5. 覆盖索引 / 部分索引 —— sitemap 免回表；未打标书按 created_at 直接命中
--   6. 同步触发器        —— 派生结构与 books 保持一致，应用层无需额外维护
--
-- 实测（本地 D1 引擎 + 全量 34,322 行，D1 meta.rows_read）：
--   首页分页 34,334 → 13；关联书籍 68,644 → 28；标签页 34,941 → 49；
--   日期归档 68,644 → 142；单日书籍 34,322 → 291；未打标 cron 2,812 → 50。
--   触发器已验证在插入/下载+1/改标签/改标题/删除后，派生结构与计数器一致。
--
-- 本脚本幂等（IF NOT EXISTS / rebuild / INSERT OR IGNORE），表里已有数据时重跑同样安全。
-- 应用: pnpm db:d1:migrate:local / pnpm db:d1:migrate:remote
CREATE INDEX IF NOT EXISTS books_download_count_idx ON books (download_count);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS books_created_at_idx ON books (created_at);
--> statement-breakpoint

-- sitemap / 热门列表覆盖索引：ORDER BY download_count DESC 时免回表（只读索引即可拿到 id+updated_at）
CREATE INDEX IF NOT EXISTS books_dc_cover_idx ON books (download_count DESC, id, updated_at);
--> statement-breakpoint

-- 1) 标题三元组全文索引。外部内容表不重复存正文，只维护倒排索引；rowid 与 books 对齐。
CREATE VIRTUAL TABLE IF NOT EXISTS books_title_fts USING fts5 (
  title,
  content='books',
  content_rowid='rowid',
  tokenize='trigram'
);
--> statement-breakpoint

-- 一次性回填（读一遍 books，约 3.4 万行）。rebuild 幂等，重跑安全。
INSERT INTO books_title_fts (books_title_fts) VALUES('rebuild');
--> statement-breakpoint

-- 2) 标签倒排表。WITHOUT ROWID：主键即聚簇存储，(tag, book_id) 定位只有一层 B 树。
CREATE TABLE IF NOT EXISTS book_tags (
  tag TEXT NOT NULL,
  book_id TEXT NOT NULL,
  download_count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (tag, book_id)
) WITHOUT ROWID;
--> statement-breakpoint
-- 标签页排序键：WHERE tag = ? ORDER BY download_count DESC LIMIT ? 直接走索引，读行数 ≈ 分页大小
CREATE INDEX IF NOT EXISTS book_tags_tag_dc_idx ON book_tags (tag, download_count DESC, book_id ASC);
--> statement-breakpoint
-- 按书反查标签（下载量变化时同步 book_tags.download_count）
CREATE INDEX IF NOT EXISTS book_tags_book_idx ON book_tags (book_id);
--> statement-breakpoint

-- 3) 收录日期清单表（(date) 主键即天然按日期有序，取全部日期只需读「有书的天数」行）
CREATE TABLE IF NOT EXISTS book_dates (
  date TEXT PRIMARY KEY,
  book_count INTEGER NOT NULL DEFAULT 0
) WITHOUT ROWID;
--> statement-breakpoint

-- 4) 精确计数器：key = 'total' 或 'tag:<标签名>'
CREATE TABLE IF NOT EXISTS book_stats (
  key TEXT PRIMARY KEY,
  value INTEGER NOT NULL
) WITHOUT ROWID;
--> statement-breakpoint

-- 5) 空标签统一归一化为 NULL，使「未打标」查询能命中部分索引。
--    运行时 tagsEmpty 也随之简化为 `tags IS NULL`；json_valid 兜底防止脏数据触发 malformed JSON。
UPDATE books
SET tags = NULL
WHERE tags IS NOT NULL
  AND (
    tags = ''
    OR tags = '[]'
    OR json_valid(tags) = 0
    OR json_array_length(tags) = 0
  );
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS books_untagged_idx ON books (created_at)
WHERE
  tags IS NULL;
--> statement-breakpoint

-- ============================ 回填派生结构 ============================
INSERT OR IGNORE INTO book_tags (tag, book_id, download_count)
SELECT DISTINCT j.value, b.id, b.download_count
FROM books b,
  json_each(b.tags) j
WHERE b.tags IS NOT NULL
  AND b.tags <> '';
--> statement-breakpoint
INSERT OR IGNORE INTO book_dates (date, book_count)
SELECT substr(created_at, 1, 10) AS date,
  count(*)
FROM books
WHERE created_at IS NOT NULL
GROUP BY 1;
--> statement-breakpoint
INSERT OR REPLACE INTO book_stats (key, value)
VALUES ('total', (SELECT count(*) FROM books));
--> statement-breakpoint
INSERT OR REPLACE INTO book_stats (key, value)
SELECT 'tag:' || tag,
  count(*)
FROM book_tags
GROUP BY tag;
--> statement-breakpoint

-- ============================ 同步触发器 ============================
-- 新增书籍：维护全文索引、日期清单、总数计数器、标签倒排
CREATE TRIGGER IF NOT EXISTS books_derived_ai AFTER
INSERT ON books BEGIN
  INSERT INTO books_title_fts (rowid, title)
  VALUES (new.rowid, new.title);

  INSERT INTO book_dates (date, book_count)
  VALUES (
    COALESCE(substr(new.created_at, 1, 10), strftime('%Y-%m-%d', 'now')),
    1
  ) ON CONFLICT (date) DO UPDATE
  SET
    book_count = book_count + 1;

  INSERT INTO book_stats (key, value)
  VALUES ('total', 1) ON CONFLICT (key) DO UPDATE
  SET
    value = value + 1;

  INSERT OR IGNORE INTO book_tags (tag, book_id, download_count)
  SELECT value,
    new.id,
    new.download_count
  FROM json_each(
    CASE
      WHEN new.tags IS NULL
      OR json_valid(new.tags) = 0 THEN '[]'
      ELSE new.tags
    END
  );
END;
--> statement-breakpoint
-- 标题变化：重建该书的全文索引条目
CREATE TRIGGER IF NOT EXISTS books_derived_au_title AFTER
UPDATE OF title ON books BEGIN
  INSERT INTO books_title_fts (books_title_fts, rowid, title)
  VALUES ('delete', old.rowid, old.title);

  INSERT INTO books_title_fts (rowid, title)
  VALUES (new.rowid, new.title);
END;
--> statement-breakpoint
-- 标签变化：整行重建该书的倒排条目（book_tags 上的增删触发器会同步维护计数器）
CREATE TRIGGER IF NOT EXISTS books_derived_au_tags AFTER
UPDATE OF tags ON books BEGIN
  DELETE FROM book_tags
  WHERE book_id = old.id;

  INSERT OR IGNORE INTO book_tags (tag, book_id, download_count)
  SELECT value,
    new.id,
    new.download_count
  FROM json_each(
    CASE
      WHEN new.tags IS NULL
      OR json_valid(new.tags) = 0 THEN '[]'
      ELSE new.tags
    END
  );
END;
--> statement-breakpoint
-- 下载量变化：同步 book_tags 的排序键（走 book_tags_book_idx，只动该书的几行）
CREATE TRIGGER IF NOT EXISTS books_derived_au_dc AFTER
UPDATE OF download_count ON books BEGIN
  UPDATE book_tags
  SET
    download_count = new.download_count
  WHERE
    book_id = new.id;
END;
--> statement-breakpoint
-- 删除书籍（当前业务不删书，保留一致性以防万一）
CREATE TRIGGER IF NOT EXISTS books_derived_ad AFTER DELETE ON books BEGIN
  INSERT INTO books_title_fts (books_title_fts, rowid, title)
  VALUES ('delete', old.rowid, old.title);

  DELETE FROM book_tags
  WHERE book_id = old.id;

  UPDATE book_dates
  SET
    book_count = book_count - 1
  WHERE
    date = COALESCE(substr(old.created_at, 1, 10), '');

  UPDATE book_stats
  SET
    value = value - 1
  WHERE
    key = 'total';
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS book_tags_ai AFTER
INSERT ON book_tags BEGIN
  INSERT INTO book_stats (key, value)
  VALUES ('tag:' || new.tag, 1) ON CONFLICT (key) DO UPDATE
  SET
    value = value + 1;
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS book_tags_ad AFTER DELETE ON book_tags BEGIN
  UPDATE book_stats
  SET
    value = max(value - 1, 0)
  WHERE
    key = 'tag:' || old.tag;
END;
