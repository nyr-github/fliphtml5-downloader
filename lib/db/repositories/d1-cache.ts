/**
 * D1 结果缓存（Cloudflare KV）。
 *
 * 只用于「读取行数随结果集规模增长、已无法再靠索引收敛」的查询：sitemap 的整表量级、
 * 相关书籍的 FTS 命中计数、日期清单、单日书籍。被索引 / LIMIT 钉死为常数行的查询
 * （列表分页、按标签、主键点查、待打标扫描）不走这里——它们本就直接查更快。
 *
 * 仅在 Cloudflare Worker 运行时（存在 BOOKS_CACHE 绑定）生效；本地 Postgres 路径或
 * 缺少绑定时自动降级为直接查库，既不缓存也不报错，保持 Vercel / 脚本环境行为不变。
 */

const KV_BINDING = "BOOKS_CACHE";

// 项目未引入 @cloudflare/workers-types（D1 侧同样靠 drizzle 推导类型），
// 这里只声明用到的两个方法，避免为一个缓存文件新增全局类型依赖。
interface KvLike {
  get<T>(key: string, type: "json"): Promise<T | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
}

async function getKv(): Promise<KvLike | undefined> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = getCloudflareContext();
    return (env as unknown as Record<string, KvLike | undefined>)[KV_BINDING];
  } catch {
    return undefined; // 非 Worker 运行时（Vercel / 本地脚本 / 构建期）
  }
}

/** FNV-1a 32 位同步哈希：把任意参数序列压成定长、无非法字符的 KV key 片段 */
function hash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/** 生成缓存 key；参数经哈希，规避 title 等自由文本里的非法字符与长度上限 */
export function cacheKey(method: string, ...parts: Array<string | number>): string {
  return `d1:${method}:${hash(parts.join("|"))}`;
}

/** JSON 往返会把 Date 变成 ISO 字符串，读回时按字段名还原（dates 清单是 'YYYY-MM-DD' 字符串键，不受影响） */
function reviveDates(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(reviveDates);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] =
        (k === "createdAt" || k === "updatedAt") && typeof v === "string"
          ? new Date(v)
          : reviveDates(v);
    }
    return out;
  }
  return value;
}

/**
 * 先读 KV，未命中执行 loader 并按 ttl 写回。
 * loader 抛错时不写缓存（避免把失败或空结果缓存住），错误原样冒泡给调用方兜底。
 */
export async function cachedQuery<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  const kv = await getKv();
  if (!kv) return loader();

  try {
    const hit = await kv.get<T>(key, "json");
    if (hit != null) return reviveDates(hit) as T;
  } catch {
    // 读缓存失败当作未命中，继续查库
  }

  const value = await loader();
  try {
    await kv.put(key, JSON.stringify(value), { expirationTtl: ttlSeconds });
  } catch {
    // 写缓存失败不影响本次返回
  }
  return value;
}
