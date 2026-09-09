#!/usr/bin/env tsx
/**
 * 在 OpenNext 构建产物打包为 Cloudflare Worker 之前，剔除超过 Worker 静态资源
 * 单文件上限（25 MiB）的资源。
 *
 * 背景：`public/` 下存在若干未被应用引用的大体积视频（演示/录屏源文件），
 * 它们会被复制到 `.open-next/assets`。Cloudflare Workers 对单个静态资源有
 * 25 MiB 硬上限，超过会导致 `wrangler deploy` 失败（Asset too large）。
 *
 * 本脚本仅处理构建产物目录，绝不改动仓库中的 `public/`，因此 Vercel / VPS
 * 部署不受影响。若将来需要在线上提供这些视频，应改用 R2 / Cloudflare Stream
 * 等对象存储或流媒体方案，而非 Worker 静态资源。
 *
 * 用法（已并入 preview / deploy / upload 脚本）：
 *   opennextjs-cloudflare build && tsx scripts/prune-cf-assets.ts && opennextjs-cloudflare deploy
 */
import { promises as fs } from "fs";
import path from "path";

// Worker 单资源上限 25 MiB；留出余量，按 24 MiB 触发剔除。
const MAX_ASSET_BYTES = 24 * 1024 * 1024;

const ASSETS_DIR = path.resolve(process.cwd(), ".open-next", "assets");

async function walk(dir: string): Promise<string[]> {
  let entries: import("fs").Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (entry.isFile()) {
      files.push(full);
    }
  }
  return files;
}

async function main() {
  const files = await walk(ASSETS_DIR);
  let removed = 0;
  let freed = 0;

  for (const file of files) {
    const stat = await fs.stat(file);
    if (stat.size > MAX_ASSET_BYTES) {
      await fs.unlink(file);
      removed += 1;
      freed += stat.size;
      const rel = path.relative(ASSETS_DIR, file);
      console.log(
        `🗑️  pruned ${rel} (${(stat.size / 1024 / 1024).toFixed(1)} MiB > 25 MiB Worker asset limit)`,
      );
    }
  }

  if (removed === 0) {
    console.log("✅ No assets exceed the Cloudflare Worker size limit.");
  } else {
    console.log(
      `✅ Pruned ${removed} oversized asset(s), freed ${(freed / 1024 / 1024).toFixed(1)} MiB from the Workers bundle.`,
    );
  }
}

main().catch((err) => {
  console.error("Failed to prune Cloudflare assets:", err);
  process.exit(1);
});
