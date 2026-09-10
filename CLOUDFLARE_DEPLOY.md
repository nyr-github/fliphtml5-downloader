# Cloudflare Pages 部署指南

## 问题修复总结

在部署到Cloudflare Pages时，我们修复了以下问题：

### 1. ✅ 创建 wrangler.toml 配置文件

- 添加了Cloudflare Workers配置
- 设置了Node.js兼容性标志
- 配置了构建命令

### 2. ✅ 修复 SEO 提交 500 错误

- 在 `scripts/generate-blog-list.ts` 中添加了错误处理
- SEO提交失败不再阻止构建过程
- 添加了友好的警告信息

### 3. ✅ 处理 IndexedDB 兼容性

- 代码中已有完善的检测机制
- 构建时的警告是正常的（Node.js环境不支持IndexedDB）
- 运行时在浏览器中会正常工作

### 4. ✅ 修复数据库连接

- 使用 `postgres` 库连接Supabase PostgreSQL
- 使用 `drizzle-orm/postgres-js` 适配器
- 配置 `{ prepare: false }` 以兼容Cloudflare Workers环境

## 部署步骤

### 1. 在Cloudflare Dashboard中配置环境变量

你需要在Cloudflare Pages设置中添加以下环境变量：

```
DATABASE_URL=your_neon_database_url
CRON_SECRET=your_cron_secret
NEXT_PUBLIC_BASE_URL=https://your-domain.com
DISCORD_WEBHOOK_URL=your_discord_webhook_url (可选)
SEO_SUBMIT_URL=your_seo_submit_url (可选)
```

### 2. 设置构建配置

在Cloudflare Pages项目中：

- **Framework preset**: Next.js
- **Build command**: `npx @cloudflare/next-on-pages@1`
- **Build output directory**: `.vercel/output/static`
- **Root directory**: `/` (根目录)

### 3. 环境变量设置位置

1. 登录Cloudflare Dashboard
2. 进入 Pages > 你的项目
3. 点击 "Settings" > "Environment variables"
4. 添加上述环境变量

### 4. 数据库配置

项目使用Supabase PostgreSQL作为数据库提供商：

1. 在 [Supabase](https://supabase.com) 创建项目
2. 进入项目 Settings > Database
3. 复制 Connection string (选择 Transactional 模式)
4. 将连接字符串设置为 `DATABASE_URL` 环境变量

Supabase连接字符串格式：

```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

## 验证部署

部署成功后，验证以下功能：

### API端点测试

```bash
# 测试 updates API
curl "https://your-domain.com/api/updates?date=2024-01-01"

# 测试 books API
curl "https://your-domain.com/api/books"
```

### 页面测试

- 首页: `https://your-domain.com`
- 博客列表: `https://your-domain.com/blog`
- 书籍浏览: `https://your-domain.com/books`

## 常见问题

### Q: 构建失败，提示数据库连接错误

A: 确保 `DATABASE_URL` 环境变量已正确配置，使用Supabase的Transactional模式连接字符串

### Q: SEO提交仍然失败

A: 这是预期的，除非你配置了 `SEO_SUBMIT_URL`。现在失败不会阻止构建

### Q: IndexedDB警告

A: 这是构建时的正常警告，运行时在浏览器中会正常工作

### Q: 图片加载失败

A: 检查 `NEXT_PUBLIC_BASE_URL` 是否正确配置

## 性能优化建议

1. **启用缓存**: Cloudflare自动缓存静态资源
2. **使用R2存储**: 对于大量静态资源，考虑使用Cloudflare R2
3. **监控性能**: 使用Cloudflare Analytics监控性能

## 后续维护

### 定期任务

项目包含cron任务，需要配置：

- 每日书籍更新
- 标签分析
- 站点地图更新

这些可以通过Cloudflare Cron Triggers或外部cron服务配置。

## 技术支持

如遇到问题，检查：

1. Cloudflare Pages构建日志
2. 运行时错误（通过Cloudflare Analytics）
3. 数据库连接状态

---

## 【最新】Cloudflare Workers (OpenNext) 定时任务

> 上文为早期 `@cloudflare/next-on-pages` / Pages 方案，已废弃。当前 Workers 部署使用
> `@opennextjs/cloudflare` (OpenNext) + D1，定时任务机制如下。

### 机制

- Vercel 的定时任务仍由 [vercel.json](vercel.json) 的 `crons` 提供，保持不变。
- Cloudflare Workers 侧：`@opennextjs/cloudflare` 生成的 `.open-next/worker.js` **只导出 `fetch`**，
  没有 Cloudflare Cron Triggers 需要的 `scheduled`。为此新增构建后注入脚本
  [scripts/inject-cron-handler.ts](scripts/inject-cron-handler.ts)：**就地改写** `.open-next/worker.js`
  （把 `export default {` 改成 `const __worker = {`，末尾追加 `scheduled`，按 `event.cron` 直接
  `__worker.fetch(new Request(NEXT_PUBLIC_BASE_URL + "/api/cron/..."))` 触发既有路由（复用同一 `env`，含 D1 绑定））。
  不能改用「外部包装入口 import worker.js」：`worker.js` 顶部的
  `export { DOQueueHandler } from "./.build/durable-objects/queue.js"` 依赖 OpenNext 的 wrangler 插件，
  而该插件只在 `worker.js` 本身是 `main` 入口时才会把这些文件外部化；一旦被别处 import 就强制
  esbuild 去 resolve 磁盘上不存在的文件而 Build failed。
- [wrangler.jsonc](wrangler.jsonc)：`main` 保持 `.open-next/worker.js`，`triggers.crons` 配置计划（UTC）。
- 注入已并入 `pnpm preview` / `deploy` / `deploy:cf` / `upload`（在 `opennextjs-cloudflare build` 与
  `prune-cf-assets` 之后执行），无需单独运行。注入以 `__CRON_INJECTED__` 标记保证幂等，
  重复执行会直接跳过。

### 当前任务（与 vercel.json 对齐）

| Cron (UTC)   | 路由                    | 作用                         |
| ------------ | ----------------------- | ---------------------------- |
| `30 0 * * *` | `/api/cron/daily-stats` | 统计昨日新增书籍并发 Discord |
| `0 1 * * *`  | `/api/cron/tag-books`   | 为未标签书籍做 AI 标签分析   |

### 上线前必做

1. 生产机密：`wrangler secret put CRON_SECRET`（`daily-stats` 强依赖，否则返回 500）。
2. `NEXT_PUBLIC_BASE_URL`、`DISCORD_WEBHOOK_URL` 已在 `wrangler.jsonc` 的 `vars` 中；按需用 `wrangler secret put` 覆盖敏感项。
3. 若增删任务：同步修改 `wrangler.jsonc` 的 `triggers.crons`、`scripts/inject-cron-handler.ts` 的 `CRON_MAP`，三者保持一致。

### 本地验证

```bash
# 构建产物 + 注入包装入口
pnpm exec opennextjs-cloudflare build
pnpm exec tsx scripts/prune-cf-assets.ts
pnpm exec tsx scripts/inject-cron-handler.ts
# 以可手动触发 scheduled 的模式启动本地 Worker（.dev.vars 已含本地 CRON_SECRET）
pnpm exec wrangler dev --test-scheduled --ip 127.0.0.1 --port 8787
# 另一个终端：模拟某个 cron 表达式触发
curl "http://127.0.0.1:8787/cdn-cgi/handler/scheduled?cron=30+0+*+*+*"
# 观察终端日志出现：[cron] /api/cron/daily-stats ... -> 200
```

---

## 部署路径（R2 增量缓存 / ISR）

[open-next.config.ts](open-next.config.ts) 把 Next.js 的数据缓存（`unstable_cache`）与 ISR 落在 R2
（绑定 `NEXT_INC_CACHE_R2_BUCKET` → bucket `flipbook-next-cache`），时间型再验证走 Durable Object 队列
（`NEXT_CACHE_DO_QUEUE` + 必需的 `WORKER_SELF_REFERENCE` 自服务绑定）。两种部署命令：

| 命令 | 最后一步 | 说明 |
| --- | --- | --- |
| `pnpm run deploy` | `opennextjs-cloudflare deploy` | 部署前把构建期的 ISR 条目**预填充**进远端 R2。要求本机能访问 `*.workers.dev`（预填充经由临时 helper Worker `open-next-cache-populate.<account>.workers.dev`）。 |
| `pnpm run deploy:cf` | `tsx scripts/deploy-cf.ts` | 跳过预填充，直接 `wrangler deploy`（内部设 `OPEN_NEXT_DEPLOY=true` 防止 wrangler 反向委托造成递归）。缓存由线上首请求懒写入。 |

两者前三步（`opennextjs-cloudflare build` → `prune-cf-assets` → `inject-cron-handler`）完全一致。

### 预填充失败长什么样

```
ERROR Attempt 15 to write "incremental-cache/<buildId>/xxxx.fetch" failed with a
  retryable error: Failed to send request to R2 worker: The operation was aborted due to timeout.
Error: Failed to populate remote R2 bucket "flipbook-next-cache" ...
```

看到这个说明是**本机到不了 workers.dev**，不是缓存配置写错：`wrangler deploy` 排在预填充之后，
所以此时线上并未变更（不会出现半部署）。改用 `pnpm run deploy:cf` 即可。同一网络限制下
`wrangler tail` 也会 `ETIMEDOUT`，别把它误判成 Worker 故障。

另：每次部署 `buildId` 变化会让 R2 里旧前缀的条目变成孤儿（各路由需各自回源一次）。条目都很小，
需要清理时按 `incremental-cache/<旧buildId>/` 前缀删对象即可。

### 验证缓存到底有没有命中

本地：`pnpm run preview`（端口以 package.json 为准），并在 `.dev.vars` 里打开 `NEXT_PRIVATE_DEBUG_CACHE=1`，
日志会出现 `[R2IncrementalCache] get/set <key>`——首请求 `get→set`，之后只剩 `get` 就是命中（0 行 D1）。

线上：不方便开日志，用响应头里的 Worker 真实耗时（排除客户端 RTT 与带宽噪声）：

```powershell
# 挑一个部署后从未被访问过的书籍 id
(Invoke-WebRequest https://fliphtml5.aivaded.com/book/<id> -Method Head).Headers['Server-Timing']
# Server-Timing: cfEdge;dur=...,cfOrigin;dur=0,cfWorker;dur=861   <- 冷（真打 D1）
# 连续再请求，cfWorker 降到 ~350 说明走了 R2；若一直停在冷值，说明远端写入没成功。
```

参考实测量级（D1 共 34,322 行）：`/sitemap.xml`（20,487 条 URL）从「每请求 1 万行」降为「每小时 1 万行」；
`/book/{id}` 命中后 0 次 D1 查询。
