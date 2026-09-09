#!/usr/bin/env tsx

/**
 * Postgres(Supabase) -> Cloudflare D1 数据迁移脚本
 *
 * 作用：导出 Postgres `books` 表的全部数据，转换成 D1(SQLite) 的存储格式，
 * 生成 SQL 文件并通过 wrangler 导入 D1。
 *
 * 格式转换规则（与 lib/db/repositories/d1-repo.ts 完全对齐）：
 * - tags: Postgres varchar[] -> JSON 文本，例如 '["Education","Business"]'
 * - created_at / updated_at: timestamp -> 'YYYY-MM-DD HH:MM:SS'（UTC 文本）
 *
 * 使用方法：
 *   pnpm migrate:pg-to-d1                              # 导出 + 导入远端 D1（默认 merge 合并）
 *   pnpm migrate:pg-to-d1:export                       # 只导出，不写库
 *   pnpm migrate:pg-to-d1:local                        # 导入本地 D1（先在本地验证）
 *   pnpm migrate:pg-to-d1:preview                      # 只预览将生成的 SQL
 *   pnpm migrate:pg-to-d1:check                        # 只核对 Postgres 与 D1 的总量
 *   pnpm tsx scripts/migrate-pg-to-d1.ts --mode=upsert # 已存在同 id 则直接覆盖
 *   pnpm tsx scripts/migrate-pg-to-d1.ts --mode=ignore # 已存在同 id 则跳过
 *
 * 同 id 冲突处理（--mode）：
 *   merge （默认） 首次创建时间以 Postgres 为准，download_count 取两边较大值，
 *                 描述/标签/缩略图空值互补，重跑幂等。
 *   ignore        只插入 D1 中不存在的 id，保留 D1 现有行。
 *   upsert        用 Postgres 数据完全覆盖 D1 同 id 行。
 *
 * Postgres 连接选项：
 *   --pg-url=<串>          覆盖 DATABASE_URL
 *   --pg-ca=<路径>         信任的 CA 证书（默认自动使用 certs/supabase-root-2021-ca.pem）
 *   --pg-no-ssl            不启用 TLS（仅本地无加密的 Postgres）
 *   --pg-insecure-ssl      跳过证书校验（存在中间人风险，仅临时排查用）
 *   --read-batch=<n>       每批读取行数（默认 1000，keyset 分页）
 *   --limit=<n>            只迁移前 n 行（本地冒烟测试用）
 *
 * SQL 拆分选项：
 *   --batch-size=<n>       单条 INSERT 最大行数（默认 200）
 *   --file-size=<n>        单个 SQL 文件最大行数（默认 2000）
 *   --max-stmt-bytes=<n>   单条语句字节上限（远端默认 60000，本地默认 40000）
 *   --max-file-bytes=<n>   单个文件字节上限（远端默认 400000，本地默认 45000）
 *
 * 关于 TLS：Supabase pooler 使用自有私有 CA（Supabase Root 2021 CA，自签），
 * 不在 Node 内置信任库中，因此必须显式提供根证书，否则报 SELF_SIGNED_CERT_IN_CHAIN。
 * 根证书固定在 certs/supabase-root-2021-ca.pem，校验仍为完整校验（含域名）：
 *   subject : CN=Supabase Root 2021 CA, O=Supabase Inc
 *   sha256  : 80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA
 *   validTo : Apr 26 2031（过期后需重新固定新根证书）
 *   来源    : 从 aws-1-us-east-1.pooler.supabase.com 实际握手链中取得，使用前建议与官方公布值比对
 *
 * 连接信息来源：
 * - Postgres: 环境变量 DATABASE_URL（见 .env）
 * - D1: 由 wrangler.jsonc 的 d1_databases 配置决定，本脚本默认库名 flipbook-db
 */

// 必须在最前面加载环境变量
import "dotenv/config";

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import postgres from "postgres";

// ---- 配置常量 ----

const OUTPUT_DIR = path.resolve(process.cwd(), ".tmp-migrate");
const JSON_OUT = path.join(OUTPUT_DIR, "books-export.json");
const DEFAULT_DB_NAME = "flipbook-db";
/** 默认信任的 CA 文件（Supabase 自签根证书） */
const DEFAULT_CA_FILE = path.resolve(process.cwd(), "certs/supabase-root-2021-ca.pem");
/** 单条 INSERT 语句包含的最大行数 */
const DEFAULT_BATCH_SIZE = 200;
/** 单个 SQL 文件包含的最大行数（便于逐文件执行、失败可重试） */
const DEFAULT_FILE_SIZE = 2000;
/** 从 Postgres 分批读取的行数 */
const DEFAULT_READ_BATCH = 1000;
/**
 * 单条 SQL 语句的字节上限。
 * 实测：远端 D1 76 KB 语句正常，更大（最长描述集）会报 statement too long: SQLITE_TOOBIG，
 * 本地 miniflare 阈值更低，因此默认取 60 KB（远低于已通过的 76 KB）。
 */
const DEFAULT_MAX_STMT_BYTES = 60_000;
/** 单个 SQL 文件的字节上限（便于分批提交、失败只重跑小文件） */
const DEFAULT_MAX_FILE_BYTES = 400_000;
/**
 * 本地 D1（miniflare）会把整个文件的多条语句合成一批提交，实测体积敏感（106 KB 就报
 * SQLITE_TOOBIG，而单条 44 KB 正常），因此 --target=local 默认让一个文件只装一条语句。
 */
const LOCAL_MAX_STMT_BYTES = 40_000;
const LOCAL_MAX_FILE_BYTES = 45_000;

// ---- 命令行参数 ----

interface Args {
    target: "local" | "remote";
    /**
     * 同 id 冲突时的处理：
     * - ignore: 跳过，保留 D1 现有行
     * - upsert: 完全用 Postgres 数据覆盖
     * - merge : 合并（默认）——首次时间/下载量取历史值，空字段互补
     */
    mode: "ignore" | "upsert" | "merge";
    exportOnly: boolean;
    dryRun: boolean;
    /** 只做导出与核对，不写库 */
    check: boolean;
    batchSize: number;
    fileSize: number;
    readBatch: number;
    limit: number | null;
    dbName: string;
    maxStmtBytes: number;
    maxFileBytes: number;
    maxStmtBytesExplicit: boolean;
    maxFileBytesExplicit: boolean;
    pgUrl: string | undefined;
    pgCa: string | undefined;
    pgInsecureSsl: boolean;
    pgNoSsl: boolean;
}

function parseArgs(): Args {
    const argv = process.argv.slice(2);
    const has = (flag: string) => argv.includes(flag);
    const val = (name: string): string | undefined => {
        const eq = argv.find((a) => a.startsWith(`--${name}=`));
        if (eq) return eq.split("=").slice(1).join("=");
        const i = argv.indexOf(`--${name}`);
        return i >= 0 ? argv[i + 1] : undefined;
    };

    const target = val("target");
    const mode = val("mode");
    const num = (v: string | undefined, fallback: number) => {
        const n = Number(v);
        return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
    };

    return {
        target: target === "local" ? "local" : "remote",
        mode:
            mode === "upsert" || has("--replace")
                ? "upsert"
                : mode === "ignore"
                    ? "ignore"
                    : "merge",
        exportOnly: has("--export-only") || has("--export"),
        dryRun: has("--dry-run"),
        check: has("--check"),
        batchSize: num(val("batch-size"), DEFAULT_BATCH_SIZE),
        fileSize: num(val("file-size"), DEFAULT_FILE_SIZE),
        readBatch: num(val("read-batch"), DEFAULT_READ_BATCH),
        dbName: val("db-name") ?? DEFAULT_DB_NAME,
        maxStmtBytesExplicit: val("max-stmt-bytes") !== undefined,
        maxFileBytesExplicit: val("max-file-bytes") !== undefined,
        maxStmtBytes: num(val("max-stmt-bytes"), DEFAULT_MAX_STMT_BYTES),
        maxFileBytes: num(val("max-file-bytes"), DEFAULT_MAX_FILE_BYTES),
        limit: (() => {
            const n = Number(val("limit"));
            return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
        })(),
        pgUrl: val("pg-url"),
        pgCa: val("pg-ca") ?? process.env.PGSSLROOTCERT,
        pgNoSsl: has("--pg-no-ssl"),
        pgInsecureSsl: has("--pg-insecure-ssl"),
    };
}

// ---- 数据结构 ----

/** Postgres 侧的原始行 */
interface PgBookRow {
    id: string;
    id1: string;
    id2: string;
    title: string;
    description: string | null;
    tags: unknown;
    thumbnail: string;
    pageCount: number;
    downloadCount: number;
    createdAt: Date | string | null;
    updatedAt: Date | string | null;
}

/** D1 侧的目标行（全部为 SQLite 友好类型） */
interface D1BookRow {
    id: string;
    id1: string;
    id2: string;
    title: string;
    description: string | null;
    tags: string | null;
    thumbnail: string;
    page_count: number;
    download_count: number;
    created_at: string | null;
    updated_at: string | null;
}

// ---- 格式转换辅助 ----

/** 与 d1-repo.ts 的 toDb() 保持一致：'YYYY-MM-DD HH:MM:SS'（UTC） */
function toDbText(d: Date | string | null): string | null {
    if (d === null || d === undefined || d === "") return null;
    const date = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().replace("T", " ").slice(0, 19);
}

/**
 * Postgres varchar[] -> JSON 数组文本。
 * postgres-js 通常直接返回 string[]；这里额外兼容字符串形态的数组字面量。
 */
function toTagsJson(raw: unknown): string | null {
    if (raw === null || raw === undefined) return null;
    let arr: string[] = [];
    if (Array.isArray(raw)) {
        arr = raw.map((v) => String(v));
    } else if (typeof raw === "string") {
        const s = raw.trim();
        if (s.startsWith("[")) {
            try {
                const parsed = JSON.parse(s);
                arr = Array.isArray(parsed) ? parsed.map((v) => String(v)) : [];
            } catch {
                arr = [];
            }
        } else if (s.startsWith("{") && s.endsWith("}")) {
            arr = s
                .slice(1, -1)
                .split(",")
                .map((v) => v.replace(/^"|"$/g, "").trim())
                .filter(Boolean);
        } else if (s.length > 0) {
            arr = [s];
        }
    }
    return JSON.stringify(arr);
}

function mapToD1(row: PgBookRow): D1BookRow {
    return {
        id: row.id,
        id1: row.id1,
        id2: row.id2,
        title: row.title,
        description: row.description ?? null,
        tags: toTagsJson(row.tags),
        thumbnail: row.thumbnail,
        page_count: Number(row.pageCount ?? 0),
        download_count: Number(row.downloadCount ?? 0),
        created_at: toDbText(row.createdAt),
        updated_at: toDbText(row.updatedAt),
    };
}

// ---- SQL 生成 ----

function lit(v: string | number | null): string {
    if (v === null) return "NULL";
    if (typeof v === "number") return String(v);
    // SQLite 字符串转义：单引号翻倍；顺带清理会破坏语句的 NUL 字符
    return `'${v.replace(/\0/g, "").replace(/'/g, "''")}'`;
}

const COLUMNS = [
    "id",
    "id1",
    "id2",
    "title",
    "description",
    "tags",
    "thumbnail",
    "page_count",
    "download_count",
    "created_at",
    "updated_at",
] as const;

function rowValues(r: D1BookRow): string {
    return `(${[
        lit(r.id),
        lit(r.id1),
        lit(r.id2),
        lit(r.title),
        lit(r.description),
        lit(r.tags),
        lit(r.thumbnail),
        lit(r.page_count),
        lit(r.download_count),
        lit(r.created_at),
        lit(r.updated_at),
    ].join(",")})`;
}

const INSERT_PREFIX = `INSERT INTO books (${COLUMNS.join(", ")}) VALUES\n`;

function conflictClause(mode: Args["mode"]): string {
    if (mode === "upsert") {
        return `ON CONFLICT(id) DO UPDATE SET
  id1 = excluded.id1,
  id2 = excluded.id2,
  title = excluded.title,
  description = excluded.description,
  tags = excluded.tags,
  thumbnail = excluded.thumbnail,
  page_count = excluded.page_count,
  download_count = excluded.download_count,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at`;
    }
    if (mode === "merge") {
        // 两边是分叉的副本：D1 里已存在的行是切库后新写入的，
        // 因此首次创建时间以 Postgres 为准，下载量取两者较大值，文本字段空值互补。
        return `ON CONFLICT(id) DO UPDATE SET
  id1 = excluded.id1,
  id2 = excluded.id2,
  title = COALESCE(NULLIF(books.title, ''), excluded.title),
  description = CASE
    WHEN books.description IS NULL OR books.description = '' THEN excluded.description
    ELSE books.description END,
  tags = CASE
    WHEN books.tags IS NULL OR books.tags = '' OR books.tags = '[]' THEN excluded.tags
    ELSE books.tags END,
  thumbnail = COALESCE(NULLIF(books.thumbnail, ''), excluded.thumbnail),
  page_count = CASE WHEN books.page_count > 0 THEN books.page_count ELSE excluded.page_count END,
  download_count = MAX(books.download_count, excluded.download_count),
  created_at = COALESCE(excluded.created_at, books.created_at),
  updated_at = CASE
    WHEN books.updated_at IS NULL OR books.updated_at < excluded.updated_at THEN excluded.updated_at
    ELSE books.updated_at END`;
    }
    return "ON CONFLICT(id) DO NOTHING";
}

function buildStatement(values: string[], mode: Args["mode"]): string {
    return `${INSERT_PREFIX}${values.join(",\n")}\n${conflictClause(mode)};`;
}

const byteLen = (s: string) => Buffer.byteLength(s, "utf8");

/**
 * 拆分策略：同时受「行数」和「字节数」约束。
 * SQLite 单条语句上限为 1,000,000 字节（超出报 SQLITE_TOOBIG），
 * 而 description 可能很长，所以不能只按固定行数切分。
 */
function writeSqlFiles(
    rows: D1BookRow[],
    args: Args,
): { files: string[]; statements: number } {
    const header = [
        `-- 由 scripts/migrate-pg-to-d1.ts 生成于 ${new Date().toISOString()}`,
        `-- 来源: Postgres books 表 -> D1(${args.dbName})，模式: ${args.mode}`,
        "",
    ].join("\n");

    const conflictBytes = byteLen(conflictClause(args.mode)) + 2;
    const stmtLimit = args.maxStmtBytes;
    const fileLimit = args.maxFileBytes;

    // 清理上一次生成的 SQL，避免残留文件干扰手动重跑
    for (const old of fs.readdirSync(OUTPUT_DIR)) {
        if (/^books-d1-\d+\.sql$/.test(old)) fs.rmSync(path.join(OUTPUT_DIR, old));
    }

    const files: string[] = [];
    let statements = 0;

    let stmtValues: string[] = [];
    let stmtBytes = byteLen(INSERT_PREFIX) + conflictBytes;
    let fileStmts: string[] = [];
    let fileBytes = byteLen(header);
    let fileRows = 0;

    const flushFile = () => {
        if (fileStmts.length === 0) return;
        const index = files.length + 1;
        const name = path.join(
            OUTPUT_DIR,
            `books-d1-${String(index).padStart(3, "0")}.sql`,
        );
        fs.writeFileSync(name, header + fileStmts.join("\n\n") + "\n", "utf8");
        files.push(name);
        fileStmts = [];
        fileBytes = byteLen(header);
        fileRows = 0;
    };

    const flushStatement = () => {
        if (stmtValues.length === 0) return;
        const stmt = buildStatement(stmtValues, args.mode);
        const size = byteLen(stmt);
        if (fileStmts.length > 0 && fileBytes + size + 2 > fileLimit) flushFile();
        fileStmts.push(stmt);
        fileBytes += size + 2;
        statements += 1;
        stmtValues = [];
        stmtBytes = byteLen(INSERT_PREFIX) + conflictBytes;
    };

    for (const row of rows) {
        const value = rowValues(row);
        const size = byteLen(value) + 2;

        if (stmtValues.length > 0 && stmtBytes + size > stmtLimit) flushStatement();
        if (stmtValues.length > 0 && stmtValues.length >= args.batchSize) {
            flushStatement();
        }
        if (fileRows >= args.fileSize && stmtValues.length === 0) flushFile();

        if (stmtValues.length === 0 && stmtBytes + size > stmtLimit) {
            console.warn(
                `⚠️  id=${row.id} 单行约 ${Math.round(size / 1024)} KB，` +
                `超过语句上限 ${Math.round(stmtLimit / 1024)} KB，将单独成句（可能被 SQLite 拒绝）`,
            );
        }

        stmtValues.push(value);
        stmtBytes += size;
        fileRows += 1;
    }

    flushStatement();
    flushFile();
    return { files, statements };
}

// ---- wrangler 调用 ----

function runWrangler(wranglerArgs: string[]): {
    status: number;
    stdout: string;
    stderr: string;
} {
    const cmd = `wrangler ${wranglerArgs.join(" ")}`;
    const res = spawnSync(cmd, {
        encoding: "utf8",
        shell: true,
        maxBuffer: 256 * 1024 * 1024,
    });
    return {
        status: res.status ?? 1,
        stdout: res.stdout ?? "",
        stderr: res.stderr ?? "",
    };
}

/** 执行一条查询并尽量解析出 JSON 结果 */
function queryD1(dbName: string, target: Args["target"], sql: string): unknown {
    const res = runWrangler([
        "d1",
        "execute",
        dbName,
        `--command`,
        `"${sql.replace(/"/g, '\\"')}"`,
        `--${target}`,
        "--json",
    ]);
    if (res.status !== 0) {
        throw new Error(
            `查询 D1 失败: ${sql}\n${res.stderr || res.stdout}`,
        );
    }
    const out = (res.stdout || "").trim();
    const start = out.indexOf("[") >= 0 ? out.indexOf("[") : out.indexOf("{");
    if (start < 0) return null;
    try {
        return JSON.parse(out.slice(start));
    } catch {
        return null;
    }
}

/** 执行单值聚合查询，返回第一个结果的 `c` 字段 */
function queryScalar(
    dbName: string,
    target: Args["target"],
    sql: string,
): number | null {
    const parsed = queryD1(dbName, target, sql);
    // wrangler --json 输出为 [{ results: [{ c: N }] }, ...]
    const first = Array.isArray(parsed) ? parsed[0] : parsed;
    const c = first?.results?.[0]?.c;
    return typeof c === "number" ? c : null;
}

function countD1Books(dbName: string, target: Args["target"]): number | null {
    return queryScalar(dbName, target, "SELECT COUNT(*) AS c FROM books;");
}

/**
 * 迁移后核对：把导出集与 D1 的行数 / 唯一 id / 下载量总量列在一起。
 * 注意 D1 上线后会自己写入新行、自己累加 download_count，
 * 因此预期 D1 侧 >= Postgres 侧，而不是严格相等。
 */
function verifyCounts(rows: D1BookRow[], args: Args): void {
    const pg = {
        rows: rows.length,
        distinctIds: new Set(rows.map((r) => r.id)).size,
        downloads: rows.reduce((s, r) => s + (r.download_count || 0), 0),
    };
    const d1 = {
        rows: queryScalar(args.dbName, args.target, "SELECT COUNT(*) AS c FROM books;"),
        distinctIds: queryScalar(
            args.dbName,
            args.target,
            "SELECT COUNT(DISTINCT id) AS c FROM books;",
        ),
        downloads: queryScalar(
            args.dbName,
            args.target,
            "SELECT SUM(download_count) AS c FROM books;",
        ),
    };
    const fmt = (n: number | null) => (n === null ? "?" : String(n).padStart(9));
    console.log("\n🔎 核对（Postgres 导出集 vs D1 当前库）");
    console.log(`             ${"Postgres".padStart(9)}   ${"D1".padStart(9)}   差异`);
    console.log(
        `   行数     ${fmt(pg.rows)}   ${fmt(d1.rows)}   ${d1.rows === null ? "?" : d1.rows - pg.rows} （D1 包含切库后新增书）`,
    );
    console.log(
        `   唯一 id  ${fmt(pg.distinctIds)}   ${fmt(d1.distinctIds)}   ${d1.distinctIds === null ? "?" : d1.distinctIds - pg.distinctIds}`,
    );
    console.log(
        `   下载量   ${fmt(pg.downloads)}   ${fmt(d1.downloads)}   ${d1.downloads === null ? "?" : d1.downloads - pg.downloads} （D1 包含切库后的新下载）`,
    );
    if (d1.rows !== null && d1.rows < pg.rows) {
        console.error(
            `❌ D1 行数少于导出行数，部分数据未写入，请重跑（merge 幂等）或查看上方失败文件`,
        );
    } else if (d1.distinctIds !== null && d1.distinctIds !== d1.rows) {
        console.error("❌ D1 存在重复 id，请排查主键约束");
    }
}

function d1TableExists(dbName: string, target: Args["target"]): boolean {
    const parsed = queryD1(
        dbName,
        target,
        "SELECT name FROM sqlite_master WHERE type='table' AND name='books';",
    );
    const first = Array.isArray(parsed) ? parsed[0] : parsed;
    return Array.isArray(first?.results) && first.results.length > 0;
}

// ---- 主流程 ----

/**
 * 构造 postgres-js 的 ssl 选项。
 * 默认使用固定在本仓库的 Supabase 根证书做完整校验（含域名校验）。
 */
function buildSslOptions(args: Args): Record<string, unknown> | undefined {
    if (args.pgNoSsl) return undefined;
    if (args.pgInsecureSsl) {
        console.warn(
            "⚠️  --pg-insecure-ssl 已关闭证书校验，存在中间人攻击风险，仅用于临时排查。\n",
        );
        return { require: true, rejectUnauthorized: false };
    }
    const caPath = args.pgCa ?? DEFAULT_CA_FILE;
    if (fs.existsSync(caPath)) {
        return { require: true, ca: fs.readFileSync(caPath, "utf8") };
    }
    console.warn(
        `⚠️  未找到 CA 文件 ${path.relative(process.cwd(), caPath) || caPath}，` +
        "将使用系统信任库校验；连 Supabase 时会报 SELF_SIGNED_CERT_IN_CHAIN。\n",
    );
    return { require: true };
}

async function exportFromPostgres(args: Args): Promise<D1BookRow[]> {
    const url = args.pgUrl ?? process.env.DATABASE_URL;
    if (!url) {
        throw new Error(
            "未找到 Postgres 连接串：请在 .env 配置 DATABASE_URL，或使用 --pg-url=...",
        );
    }

    const sqlClient = postgres(url, {
        prepare: false, // Supabase 连接池(transaction mode)不支持 prepared statements
        max: 1,
        connect_timeout: 20,
        ...((ssl) => (ssl ? { ssl } : {}))(buildSslOptions(args)),
    });

    try {
        const all: D1BookRow[] = [];
        // keyset 分页（按主键 id 递进）：避免一次性拉取全部行时，
        // 经连接池的大结果集被服务端提前关闭连接（CONNECTION_CLOSED）。
        let lastId = "";
        for (; ;) {
            const rows = await sqlClient<PgBookRow[]>`
        SELECT id, id1, id2, title, description, tags, thumbnail,
               page_count AS "pageCount", download_count AS "downloadCount",
               created_at AS "createdAt", updated_at AS "updatedAt"
        FROM books
        WHERE id > ${lastId}
        ORDER BY id ASC
        LIMIT ${args.readBatch}
      `;
            if (rows.length === 0) break;
            for (const r of rows) all.push(mapToD1(r));
            lastId = rows[rows.length - 1].id;
            process.stdout.write(`\r   已导出 ${all.length} 行 (至 id=${lastId})`);
            if (rows.length < args.readBatch) break;
        }
        process.stdout.write("\n");
        return all;
    } finally {
        await sqlClient.end({ timeout: 5 });
    }
}

async function main() {
    const args = parseArgs();

    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    console.log("📤 步骤 1/3 从 Postgres 导出 books 数据");
    console.log(
        `   来源: ${args.pgUrl ? "--pg-url" : "DATABASE_URL(.env)"} · 批次 ${args.readBatch} 行/次`,
    );

    const rows = await exportFromPostgres(args);
    console.log(`   ✅ 导出 ${rows.length} 行\n`);

    // --target=local 且未显指定字节上限时，自动改用本地更保守的拆分上限
    if (args.target === "local") {
        if (!args.maxStmtBytesExplicit) args.maxStmtBytes = LOCAL_MAX_STMT_BYTES;
        if (!args.maxFileBytesExplicit) args.maxFileBytes = LOCAL_MAX_FILE_BYTES;
    }

    fs.writeFileSync(JSON_OUT, JSON.stringify(rows, null, 2), "utf8");
    console.log(`   📄 JSON 导出: ${path.relative(process.cwd(), JSON_OUT)}\n`);

    const limited = args.limit && rows.length > args.limit ? rows.slice(0, args.limit) : rows;
    if (limited.length !== rows.length) {
        console.log(`ℹ️  --limit=${args.limit}：仅迁移前 ${limited.length} / ${rows.length} 行\n`);
    }

    if (args.check) {
        verifyCounts(limited, args);
        return;
    }

    if (rows.length === 0) {
        console.log("ℹ️  Postgres books 表没有数据，无需导入。");
        return;
    }

    const { files, statements } = writeSqlFiles(limited, args);
    console.log("🧱 步骤 2/3 生成 D1 导入 SQL");
    console.log(
        `   拆分上限: 单句 ${args.maxStmtBytes} B / 单文件 ${args.maxFileBytes} B / 单句最多 ${args.batchSize} 行`,
    );
    console.log(`   共 ${statements} 条 INSERT 语句，拆分为 ${files.length} 个文件：`);
    for (const f of files) {
        const kb = (fs.statSync(f).size / 1024).toFixed(1);
        console.log(`     - ${path.relative(process.cwd(), f)} (${kb} KB)`);
    }
    console.log("");

    if (args.dryRun) {
        const preview = fs.readFileSync(files[0], "utf8").split("\n").slice(0, 12);
        console.log("🔍 --dry-run 预览（第一个文件的前若干行）：\n");
        console.log(preview.join("\n"));
        console.log("\n… 未执行任何写入。\n");
        return;
    }

    if (args.exportOnly) {
        console.log("ℹ️  --export-only：已生成导出文件，未导入 D1。");
        console.log(
            `   需要导入时执行: pnpm tsx scripts/migrate-pg-to-d1.ts --target=${args.target}`,
        );
        return;
    }

    console.log(`📥 步骤 3/3 导入 D1 (${args.dbName} / ${args.target})`);

    // 本地 D1 若未建表，给出明确提示（远端依赖 migration 已应用）
    let exists = false;
    try {
        exists = d1TableExists(args.dbName, args.target);
    } catch (err) {
        console.warn(
            `⚠️  无法确认 books 表是否存在（忽略继续）：${(err as Error).message}\n`,
        );
        exists = true;
    }
    if (!exists) {
        throw new Error(
            `D1(${args.target}) 中不存在 books 表，请先执行迁移：\n` +
            `   pnpm db:d1:migrate:${args.target === "local" ? "local" : "remote"}`,
        );
    }

    const before = countD1Books(args.dbName, args.target);
    if (before !== null) console.log(`   导入前 D1 行数: ${before}`);

    for (const [i, file] of files.entries()) {
        console.log(`   → (${i + 1}/${files.length}) ${path.basename(file)}`);
        const res = runWrangler([
            "d1",
            "execute",
            args.dbName,
            "--file",
            `"${file}"`,
            `--${args.target}`,
        ]);
        if (res.status !== 0) {
            console.error(res.stdout);
            console.error(res.stderr);
            const retryNote =
                args.mode === "ignore"
                    ? "DO NOTHING 会跳过已存在记录"
                    : args.mode === "upsert"
                        ? "upsert 会覆盖同 id 记录"
                        : "merge 重跑幂等，不会丢数据";
            throw new Error(
                `导入失败(${path.basename(file)})。修复后可从该文件继续执行，` +
                `已成功的文件重复执行也安全（${retryNote}）`,
            );
        }
    }

    const after = countD1Books(args.dbName, args.target);
    console.log("\n✅ 迁移完成");
    console.log(`   导出行数: ${rows.length}，本次导入行数: ${limited.length}`);
    if (before !== null && after !== null) {
        console.log(`   D1 行数: ${before} -> ${after} (新增 ${after - before})`);
    }
    console.log(`   模式: ${args.mode}`);
    verifyCounts(limited, args);
    console.log(`\n💡 抽查建议: pnpm exec wrangler d1 execute ${args.dbName} --${args.target} --command "SELECT id,title,tags,created_at FROM books ORDER BY created_at DESC LIMIT 5"`);
}

main().catch((error) => {
    console.error("\n❌ 执行失败:", (error as Error).message);
    process.exit(1);
});
