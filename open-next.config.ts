import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * 不做数据层缓存：不配置 incrementalCache / queue / tagCache，`defineCloudflareConfig`
 * 回落到默认 dummy（noop）。`unstable_cache` 与页面的 `export const revalidate` 都不再
 * 落盘。边缘未命中时，重查询（sitemap / 相关书籍 / 日期清单 / 单日书籍）由仓储层的
 * KV 缓存（lib/db/repositories/d1-cache.ts）吸收，其余被索引/LIMIT 钉死为常数行的查询直打 D1。
 *
 * 整页缓存改由 Cloudflare Workers Cache 在 HTTP 请求层承担：wrangler.jsonc 的
 * `cache.enabled` + scripts/inject-cron-handler.ts 在 Worker 出口按路径白名单改写
 * `Cache-Control`。命中边缘缓存时 Worker 完全不执行，数据层缓存已无必要。
 *
 * 保留 unstable_cache / revalidate 代码不动（运行时自动变空操作），日后要恢复数据层
 * 缓存时，只需在本文件重新传入 r2IncrementalCache / doQueue，并补回 wrangler 绑定。
 */
export default defineCloudflareConfig({});
