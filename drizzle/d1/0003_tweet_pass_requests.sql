-- Twitter/X 发帖换免费券：用户提交帖子链接 + 接收邮箱，后台审核后发放专属兑换码。
CREATE TABLE IF NOT EXISTS tweet_pass_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tweet_url TEXT NOT NULL,                 -- 用户发布的 X 帖子链接
  tweet_text TEXT NOT NULL,                -- 发帖正文快照（须包含站点链接）
  email TEXT NOT NULL,                     -- 接收免费券的邮箱
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
  code TEXT,                               -- 审核通过后分配的兑换码
  created_at TEXT NOT NULL,                -- 'YYYY-MM-DD HH:MM:SS' (UTC)
  updated_at TEXT                          -- 审核时间
);

CREATE INDEX IF NOT EXISTS idx_tweet_pass_status_created
  ON tweet_pass_requests (status, created_at);
CREATE INDEX IF NOT EXISTS idx_tweet_pass_email
  ON tweet_pass_requests (email);
