#!/usr/bin/env tsx
/**
 * 向 OpenNext 构建产物 `.open-next/worker.js` 注入两项构建后补丁：
 *  1) Cloudflare Workers 的 `scheduled`(Cron Triggers) 处理器；
 *  2) 前端页面整页边缘缓存（Workers Cache）的 `Cache-Control` 改写。
 *
 * 背景（cron）：
 * - `@opennextjs/cloudflare` 生成的 `.open-next/worker.js` 默认只导出 `fetch`，
 *   没有 `scheduled`。Cloudflare Cron Triggers 只会调用 Worker 的 `scheduled()`，
 *   因此原生构建产物无法直接承接定时任务。
 * - 不能改用「外部包装入口 import ./worker.js」的方式：worker.js 顶部有若干
 *   `export { X } from "./.build/durable-objects/*.js"`，这些文件磁盘上并不存在，
 *   依赖 OpenNext 的 wrangler 构建插件在 **worker.js 作为入口** 时将其外部化解析；
 *   一旦从别处 import 它，esbuild 会去真实 resolve 这些不存在的文件而构建失败。
 *
 * 方案：
 * - 保持 wrangler `main = .open-next/worker.js` 不变，构建后直接在本文件里：
 *   1) 把 `export default {` 改名为 `const __worker = {`；
 *   2) 追加 `scheduled` 处理器并 `export default __worker;`。
 * - `scheduled` 按 `event.cron` 命中任务，在**同一次 Worker 调用内**直接
 *   `__worker.fetch(new Request(...), env, ctx)` 触发 Next 的 `/api/cron/*` 路由
 *   （复用同一 env，含 D1 绑定），无需外部网络回环、也不需要 service 自绑定。
 *
 * 第二项职责：给前端页面整页响应注入 Cloudflare Workers Cache 的缓存头。
 * Next 对 `revalidate: 0` 的动态路由固定输出
 * `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`，只要这个头在，
 * 边缘层就不会存响应；而 `export const revalidate` 会把整条 ISR/队列链路拽进来。
 * 所以这里只在 Worker 出口按路径白名单替换 `cache-control`（配合 wrangler.jsonc 的
 * `cache.enabled`），不碰 Next 语义。命中边缘缓存时 Worker 完全不执行。
 *
 * 幂等：以 `__WORKER_PATCHES_INJECTED__` 标记判断，重复执行不会二次注入。
 * 仅改动构建产物目录，绝不修改仓库源码/`public/`，Vercel / VPS 不受影响。
 * 用法（已并入 preview / deploy / upload，在 prune 之后执行）：
 *   opennextjs-cloudflare build && tsx scripts/prune-cf-assets.ts \
 *     && tsx scripts/inject-cron-handler.ts && opennextjs-cloudflare deploy
 */
import { promises as fs } from "fs";
import path from "path";

// cron 表达式 -> 目标路由。必须与 wrangler.jsonc 的 triggers.crons 保持一致，
// 并与 vercel.json 的 Vercel Cron 计划对齐（均为 UTC）。
const CRON_MAP: Record<string, string> = {
  "30 0 * * *": "/api/cron/daily-stats",
  // "0 1 * * *": "/api/cron/tag-books",
};

const MARKER = "__WORKER_PATCHES_INJECTED__";
const DEFAULT_ENTRY_OPEN = "export default {";

// 整页边缘缓存白名单：path 正则 -> TTL（秒）。只匹配 GET/HEAD + 200 + 无 Set-Cookie。
// 全站 SSR 页面都不读 cookie/headers（无按访问者定制的内容），可安全公开缓存；
// `/api/*`、sitemap/robots 一律不进白名单（见下方「裸响应补 no-store」兜底）。TTL 按内容变更频率分档：
// 列表/首页每天有新书入库，压到 1 小时；法务与说明类页面 1 天；单本书/单篇文章 1 周。
const ONE_HOUR = 60 * 60;
const ONE_DAY = 60 * 60 * 24;
const ONE_WEEK = ONE_DAY * 7;
const EDGE_CACHE_RULES: { re: string; ttl: number }[] = [
  // 内容型：书籍详情/相关推荐/在线阅读/嵌入阅读器/博客文章
  { re: "^/book/[^/]+$", ttl: ONE_WEEK },
  { re: "^/book/[^/]+/related$", ttl: ONE_WEEK },
  { re: "^/read/iframe/[^/]+$", ttl: ONE_WEEK },
  { re: "^/read/[^/]+$", ttl: ONE_WEEK },
  { re: "^/blog/[^/]+$", ttl: ONE_WEEK },
  // 列表型：首页、书籍列表与分类/日期归档、博客列表
  { re: "^/$", ttl: ONE_HOUR },
  { re: "^/books$", ttl: ONE_HOUR },
  { re: "^/books(/.*)?$", ttl: ONE_HOUR },
  { re: "^/blog$", ttl: ONE_HOUR },
  // 纯壳/法务页
  { re: "^/(policy|pricing|qa|refund|terms-and-conditions|all-apps|history)$", ttl: ONE_DAY },
];

function buildEdgeCacheBlock(): string {
  const rules = EDGE_CACHE_RULES.map(
    (r) => `  { re: new RegExp(${JSON.stringify(r.re)}), ttl: ${r.ttl} },`,
  ).join("\n");

  return `
// 整页边缘缓存（Workers Cache）：命中时 Cloudflare 直接回缓存的 HTML，不执行 Worker。
// 保留 Next 的 Vary，RSC/预取请求会各自成变体，不会把 flight 当 HTML 回给浏览器。
const __EDGE_CACHE_RULES = [
${rules}
];
const __edgeCacheTtl = (request, response, pathname) => {
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  if (response.status !== 200) return null;
  // 带 Set-Cookie 的响应 Cloudflare 会自动 bypass，没必要改写。
  if (response.headers.has("set-cookie")) return null;
  const rule = __EDGE_CACHE_RULES.find((r) => r.re.test(pathname));
  return rule ? rule.ttl : null;
};
const __withCacheControl = (response, value) => {
  const patched = new Response(response.body, response);
  patched.headers.set("cache-control", value);
  return patched;
};
const __rawFetch = __worker.fetch.bind(__worker);
__worker.fetch = async (request, env, ctx) => {
  const response = await __rawFetch(request, env, ctx);
  try {
    const pathname = new URL(request.url).pathname;
    const ttl = __edgeCacheTtl(request, response, pathname);
    if (ttl !== null) return __withCacheControl(response, "public, max-age=" + ttl);
    // 兜底：响应完全没带 Cache-Control 时，Cloudflare 会按自己的默认 TTL 存下来跨访客共享
    // （/api/* 的 JSON 全是这种响应）。显式标 no-store，让它回到「每次执行 Worker」的旧行为。
    const isRead = request.method === "GET" || request.method === "HEAD";
    if (isRead && !response.headers.has("cache-control")) {
      return __withCacheControl(response, "no-store, must-revalidate");
    }
    return response;
  } catch (err) {
    console.error("[edge-cache] 改写缓存头失败，回退原始响应:", err);
    return response;
  }
};
`;
}

function buildFooter(): string {
  const entries = Object.entries(CRON_MAP)
    .map(([cron, p]) => `  ${JSON.stringify(cron)}: ${JSON.stringify(p)},`)
    .join("\n");

  return `

// ${MARKER} by scripts/inject-cron-handler.ts —— 请勿直接编辑，构建后自动生成。
const __CRON_PATHS = {
${entries}
};
const __CRON_ALL = Array.from(new Set(Object.values(__CRON_PATHS)));
async function __runCron(event, env, ctx) {
  const cron = typeof event?.cron === "string" ? event.cron : null;
  // 命中具体 cron 表达式则只跑对应任务；无法识别时兜底跑全部（如本地 --test-scheduled 传了别的表达式）。
  const paths = cron && __CRON_PATHS[cron] ? [__CRON_PATHS[cron]] : __CRON_ALL;
  const secret = env && env.CRON_SECRET;
  const base = (env && env.NEXT_PUBLIC_BASE_URL) || "https://bookwise.io";
  for (const p of paths) {
    try {
      const req = new Request(base + p, {
        method: "GET",
        headers: secret ? { authorization: "Bearer " + secret } : {},
      });
      const res = await __worker.fetch(req, env, ctx);
      const body = await res.clone().text().catch(() => "");
      console.log('[cron] ' + p + ' (cron="' + cron + '") -> ' + res.status + " " + body.slice(0, 300));
    } catch (err) {
      console.error("[cron] " + p + " failed:", err);
    }
  }
}
__worker.scheduled = (event, env, ctx) => {
  ctx.waitUntil(__runCron(event, env, ctx));
};
${buildEdgeCacheBlock()}export default __worker;
`;
}

async function main() {
  const root = process.cwd();
  const workerJs = path.join(root, ".open-next", "worker.js");
  const staleWrapper = path.join(root, ".open-next", "cron-worker.mjs");

  let content: string;
  try {
    content = await fs.readFile(workerJs, "utf8");
  } catch {
    console.error(
      `[inject-cron] 未找到 ${path.relative(root, workerJs)}，请先执行 opennextjs-cloudflare build。`,
    );
    process.exit(1);
  }

  // 清理早期版本可能遗留的包装入口文件。
  await fs.rm(staleWrapper, { force: true }).catch(() => { });

  if (content.includes(MARKER)) {
    console.log("[inject-worker] 检测到已注入标记，跳过（幂等）。");
    return;
  }

  if (!content.includes(DEFAULT_ENTRY_OPEN)) {
    console.error(
      `[inject-worker] 未在 worker.js 中找到 "${DEFAULT_ENTRY_OPEN}"，构建产物结构可能已变化，请检查 @opennextjs/cloudflare 版本。`,
    );
    process.exit(1);
  }

  // 仅替换首个默认导出对象为具名常量，末尾再统一导出并挂上 scheduled 与边缘缓存改写。
  const patched = content.replace(DEFAULT_ENTRY_OPEN, "const __worker = {");
  await fs.writeFile(workerJs, patched + buildFooter(), "utf8");

  console.log(
    `[inject-worker] 已注入 scheduled（${Object.values(CRON_MAP).join(", ")}）与整页边缘缓存头（${EDGE_CACHE_RULES.map((r) => r.re + " ttl=" + r.ttl + "s").join(" | ")}）到 ${path.relative(root, workerJs)}。`,
  );
}

main().catch((err) => {
  console.error("[inject-worker] 执行失败:", err);
  process.exit(1);
});
