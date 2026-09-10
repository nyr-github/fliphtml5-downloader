#!/usr/bin/env tsx
/**
 * 直接调用 `wrangler deploy` 部署已构建好的 OpenNext 产物，跳过
 * `opennextjs-cloudflare deploy` 的「部署期缓存预填充」步骤。
 *
 * 背景：`opennextjs-cloudflare deploy` 在真正跑 `wrangler deploy` **之前**，会把构建期
 * 产出的 ISR 缓存条目（本仓库约 148 条）POST 给一个临时的 helper Worker
 * `open-next-cache-populate.<account>.workers.dev`，由它写入 R2 增量缓存
 * （见 open-next.config.ts）。在访问不了 `*.workers.dev` 的网络里（本机直连
 * ETIMEDOUT，`wrangler tail` 同样不可用），这一步会重试 15 次后抛
 * `Failed to populate remote R2 bucket ...`，而此时 `wrangler deploy` 还没执行，
 * 表现是「部署失败但线上没变」，很容易被误判成缓存配置写错了。
 *
 * 预填充只是优化（把首请求的回源成本挪到部署期），不是正确性前提：跳过它，
 * R2 缓存会在线上的首次请求时懒写入，之后照样命中。
 *
 * 必须设 `OPEN_NEXT_DEPLOY=true`：新版 wrangler 在检测到 `open-next.config.ts` 的项目里
 * 会把 `wrangler deploy` 委托回 `opennextjs-cloudflare deploy`，不设这个哨兵会自我递归。
 *
 * 用法（对应 package.json 的 `deploy:cf`，需先完成 build + prune + inject-cron）：
 *   tsx scripts/deploy-cf.ts
 * 其余参数原样透传给 wrangler，例如：tsx scripts/deploy-cf.ts --dry-run
 */
import { spawnSync } from "child_process";
import { existsSync } from "fs";
import path from "path";

const wranglerCli = path.resolve(
    process.cwd(),
    "node_modules",
    "wrangler",
    "wrangler-dist",
    "cli.js",
);

// 直接用当前 node 跑 wrangler 的入口，绕开 npx/.cmd，跨平台且不经 shell。
if (!existsSync(wranglerCli)) {
    console.error(
        `找不到 wrangler 入口：${wranglerCli}\n请先安装依赖（pnpm install）。`,
    );
    process.exit(1);
}

const args = ["deploy", ...process.argv.slice(2)];
console.log(`$ wrangler ${args.join(" ")}  (OPEN_NEXT_DEPLOY=true)`);

const result = spawnSync(process.execPath, [wranglerCli, ...args], {
    stdio: "inherit",
    env: { ...process.env, OPEN_NEXT_DEPLOY: "true" },
});

if (result.error) {
    console.error("调用 wrangler 失败：", result.error);
    process.exit(1);
}

process.exit(result.status ?? 1);
