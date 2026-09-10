import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";

/**
 * 缓存必须显式配置，否则 `defineCloudflareConfig()` 的默认值是
 * `incrementalCache: "dummy"` / `queue: "dummy"`（ noop ）：
 * Next.js 的 `unstable_cache` 与 ISR 看着"写了缓存"，其实一个字节都没落盘，
 * 于是每个请求都会真打 D1（sitemap 每次 1 万行、书籍页的关联书籍数千行）。
 *
 * 这里的选择（依据 https://opennext.js.org/cloudflare/caching ）：
 * - incrementalCache: R2。官方明确不推荐 KV（最终一致，写入最长 60s 可见），
 *   且 KV 免费额度只有 1000 次写/天，34k 书籍页 + 爬虫会立刻打穿。
 *   绑定名固定为 `NEXT_INC_CACHE_R2_BUCKET`，前缀可用 `NEXT_INC_CACHE_R2_PREFIX` 改。
 * - queue: Durable Objects 队列。项目里有 `export const revalidate`（首页/博客/标签页），
 *   时间型再验证必须配队列，否则缓存条目会一直停留在首次写入的内容；
 *   DO 队列同时负责去重与失败重试。需要 wrangler.jsonc 里的
 *   `NEXT_CACHE_DO_QUEUE` 绑定 + `WORKER_SELF_REFERENCE` 自服务绑定。
 * - tagCache: 不配置。当前 `revalidateTag` 传的字符串其实来自 cache key 而非
 *   `tags` 选项，本就不会命中任何条目；等真要按标签失效时再加 d1NextTagCache。
 *
 * 数据本身仍是"拉取式"缓存（unstable_cache 命中过期条目时会在请求内异步回源重写），
 * 所以就算队列不可用，也只是"旧数据活得久一点"，不会 500。
 */
export default defineCloudflareConfig({
    incrementalCache: r2IncrementalCache,
    queue: doQueue,
});
