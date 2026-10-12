-- 审核时记录的 X 帖子作者及其是否关注 @aivaded 的结果（仅展示，不影响通过/拒绝判定）。
-- author_followed：1=已关注，0=未关注，NULL=未检查。
ALTER TABLE tweet_pass_requests ADD COLUMN author TEXT;
ALTER TABLE tweet_pass_requests ADD COLUMN author_followed INTEGER;
