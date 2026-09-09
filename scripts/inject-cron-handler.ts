#!/usr/bin/env tsx
/**
 * 向 OpenNext 构建产物 `.open-next/worker.js` 注入 Cloudflare Workers 的
 * `scheduled`(Cron Triggers) 处理器。
 *
 * 背景：
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
 * 幂等：以 `__CRON_INJECTED__` 标记判断，重复执行不会二次注入。
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
    "0 1 * * *": "/api/cron/tag-books",
};

const MARKER = "__CRON_INJECTED__";
const DEFAULT_ENTRY_OPEN = "export default {";

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
export default __worker;
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
        console.log("[inject-cron] 检测到已注入标记，跳过（幂等）。");
        return;
    }

    if (!content.includes(DEFAULT_ENTRY_OPEN)) {
        console.error(
            `[inject-cron] 未在 worker.js 中找到 "${DEFAULT_ENTRY_OPEN}"，构建产物结构可能已变化，请检查 @opennextjs/cloudflare 版本。`,
        );
        process.exit(1);
    }

    // 仅替换首个默认导出对象为具名常量，末尾再统一导出并挂上 scheduled。
    const patched = content.replace(DEFAULT_ENTRY_OPEN, "const __worker = {");
    await fs.writeFile(workerJs, patched + buildFooter(), "utf8");

    console.log(
        `[inject-cron] 已向 ${path.relative(root, workerJs)} 注入 scheduled 处理器，转发路由：${Object.values(CRON_MAP).join(", ")}。`,
    );
}

main().catch((err) => {
    console.error("[inject-cron] 执行失败:", err);
    process.exit(1);
});
