-- Discord 社区 7 天通行证：兑换码（后台批量生成，每张码最多可用 5 次，每次兑换原子扣减）。
CREATE TABLE IF NOT EXISTS discord_pass_codes (
  code TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,          -- 'YYYY-MM-DD HH:MM:SS' (UTC)
  sent_at TEXT,                      -- 发送到 Discord 的时间；NULL = 未发送
  max_uses INTEGER NOT NULL DEFAULT 5,  -- 每张码可用总次数
  used_count INTEGER NOT NULL DEFAULT 0 -- 已兑换次数
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS discord_pass_codes_created_idx
  ON discord_pass_codes (created_at, code);
