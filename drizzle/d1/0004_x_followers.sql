-- @aivaded 粉丝列表缓存：批量审核 X 帖子时，检查发帖作者是否关注了 @aivaded（仅展示，不影响通过/拒绝）。
-- 经 twitter-api45 followers.php 分页拉取后落库，user_id 为主键（screen_name 可能变更，同步时更新）。
CREATE TABLE IF NOT EXISTS x_followers (
  user_id TEXT PRIMARY KEY,                -- 粉丝的 X 用户数字 id
  screen_name TEXT NOT NULL,               -- 小写用户名，用于按作者匹配
  name TEXT,                               -- 显示名
  synced_at TEXT NOT NULL                  -- 最近一次同步时间 'YYYY-MM-DD HH:MM:SS' (UTC)
);

CREATE INDEX IF NOT EXISTS idx_x_followers_screen_name
  ON x_followers (screen_name);
