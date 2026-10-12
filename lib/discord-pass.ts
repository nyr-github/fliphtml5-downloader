// Discord 社区通行证：后台/定时批量生成兑换码 → 发 Discord → 前端兑换；每张码限用次数存库里
// （max_uses / used_count），每次兑换都读线上库并原子减 1，用完即失效。
//
// 运营参数改为运行时环境变量（改动无需重新构建，非法/缺省回退默认值）：
//   WEEK_PASS_DAYS           每次激活的周卡天数（默认 7）
//   DISCORD_PASS_MAX_USES    每张码可激活次数（默认 5）
//   DISCORD_PASS_BATCH_SIZE  每日定时自动发放的码数量（默认 10，cron 固定发这么多，不受 MAX 限制）
//   DISCORD_PASS_BATCH_MAX   后台手动单批生成的数量上限（默认 50，仅约束后台 generate）

import { DISCORD_INVITE_URL, SITE_URL } from "@/lib/constants";

export { DISCORD_INVITE_URL };

// 去除易混字符（0/O/1/I）的字母表
const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const CODE_BODY_LEN = 8;
const CODE_PREFIX = "FLIP-";

// 读取正整数环境变量；未设置或非法值回退到默认。
function envInt(name: string, fallback: number): number {
  const parsed = Math.trunc(Number(process.env[name]));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const passWeekDays = () => envInt("WEEK_PASS_DAYS", 7);
export const passCodeMaxUses = () => envInt("DISCORD_PASS_MAX_USES", 5);
export const passBatchDefault = () => envInt("DISCORD_PASS_BATCH_SIZE", 10);
// 仅作为后台手动「批量生成」的数量上限；每日定时发放固定按 DISCORD_PASS_BATCH_SIZE，不受此限制。
export const passBatchMax = () => envInt("DISCORD_PASS_BATCH_MAX", 50);

// 汇总一份配置，供公开配置接口与后台接口透出给前端展示。
export function passConfig() {
  return {
    weekDays: passWeekDays(),
    passMaxUses: passCodeMaxUses(),
    passBatchSize: passBatchDefault(),
    passBatchMax: passBatchMax(),
  };
}

function randomCode(): string {
  const bytes = new Uint8Array(CODE_BODY_LEN);
  crypto.getRandomValues(bytes);
  let body = "";
  for (const b of bytes) body += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return `${CODE_PREFIX}${body}`;
}

export function normalizePassCode(input: string): string {
  return input.toUpperCase().replace(/[\s_-]+/g, "");
}

// 'YYYY-MM-DD HH:MM:SS'（UTC），与 books 表时间写法一致
function nowStamp(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

// 项目未引入 @cloudflare/workers-types，只声明用到的方法（同 d1-cache.ts 的做法）。
interface D1Stmt {
  bind(...values: unknown[]): {
    run(): Promise<{ meta?: unknown }>;
    all<T = unknown>(): Promise<{ results?: T[] }>;
    first<T = unknown>(): Promise<T | null>;
  };
}
interface D1Like {
  prepare(query: string): D1Stmt;
  batch?(statements: D1Stmt[]): Promise<unknown>;
}

async function getD1(): Promise<D1Like | null> {
  if (process.env.DB_DRIVER !== "d1") return null;
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = getCloudflareContext();
    const dbEnv = env as unknown as Record<string, unknown>;
    return (dbEnv.DB as D1Like) ?? null;
  } catch {
    return null; // 非 Worker 运行时（Vercel / 本地脚本）
  }
}

export interface PassCodeRow {
  code: string;
  createdAt: string;
  sentAt: string | null;
  maxUses: number;
  usedCount: number;
}

export async function generatePassCodes(
  count: number = passBatchDefault(),
): Promise<string[]> {
  const db = await getD1();
  if (!db) throw new Error("D1 binding is not available");
  const n = Math.max(Math.trunc(count) || 1, 1);
  const maxUses = passCodeMaxUses();
  const ts = nowStamp();
  const codes: string[] = [];
  const seen = new Set<string>();
  while (codes.length < n) {
    const code = randomCode();
    if (seen.has(code)) continue; // 8 位随机碰撞概率极低，防御一下即可
    seen.add(code);
    await db
      .prepare(
        `INSERT INTO discord_pass_codes (code, created_at, max_uses) VALUES (?, ?, ?)
         ON CONFLICT(code) DO NOTHING`,
      )
      .bind(code, ts, maxUses)
      .run();
    codes.push(code);
  }
  return codes;
}

// 为外部渠道（Twitter 换券、邮件发放等）生成一张专属码。
// 立即标记为已发送，使其不出现在后台「复制未发送码」等待分发列表里。
export async function createPrivatePassCode(): Promise<string> {
  const codes = await generatePassCodes(1);
  if (codes.length === 0) throw new Error("code generation failed");
  await markCodesSent(codes);
  return codes[0];
}

export async function listPassCodes(limit = 100): Promise<PassCodeRow[]> {
  const db = await getD1();
  if (!db) return [];
  const res = await db
    .prepare(
      `SELECT code, created_at AS createdAt, sent_at AS sentAt,
              max_uses AS maxUses, used_count AS usedCount
       FROM discord_pass_codes ORDER BY created_at DESC, code LIMIT ?`,
    )
    .bind(limit)
    .all<PassCodeRow>();
  return res.results ?? [];
}

async function markCodesSent(codes: string[]): Promise<void> {
  const db = await getD1();
  if (!db) return;
  const ts = nowStamp();
  for (const code of codes) {
    await db
      .prepare(`UPDATE discord_pass_codes SET sent_at = ? WHERE code = ?`)
      .bind(ts, code)
      .run();
  }
}

export type SendResult =
  | { sent: number }
  | { error: "not_configured" }
  | { error: "webhook_failed" }
  | { error: "unavailable" };

// Discord 单条消息 content 上限 2000 字符，留出安全余量后按码数量分片，避免一次塞太多导致 400。
const DISCORD_MESSAGE_LIMIT = 1900;

function passMessageHeader(weekDays: number): string {
  return `🎁 ${weekDays}-Day Pass codes — FlipHTML5 Downloader`;
}
function passMessageFooter(weekDays: number, maxUses: number): string {
  return `Each code can be redeemed up to ${maxUses} times in total (first come, first served) and activates a ${weekDays}-day unlimited pass in your browser. Redeem it in the unlock dialog on the download page. 💡 Tip: share this site on X and other platforms to earn your own exclusive free pass — ${SITE_URL}/free-pass `;
}

// 贪心装箱：每条消息 = 头 + 若干码行 + 尾，累积超上限就开新条，保证单条不超长。
function chunkCodesByLimit(codes: string[], header: string, footer: string): string[][] {
  const overhead = header.length + footer.length + 2; // 头尾各占一行换行
  const chunks: string[][] = [];
  let cur: string[] = [];
  let curLen = overhead;
  for (const code of codes) {
    const lineLen = `\n• \`${code}\``.length;
    if (cur.length > 0 && curLen + lineLen > DISCORD_MESSAGE_LIMIT) {
      chunks.push(cur);
      cur = [];
      curLen = overhead;
    }
    cur.push(code);
    curLen += lineLen;
  }
  if (cur.length > 0) chunks.push(cur);
  return chunks;
}

// 发送单条 Discord 消息；遇到 webhook 限流（429）时按 Retry-After 等待后重试，其它错误不重试。
async function postPassChunk(webhookUrl: string, message: string): Promise<boolean> {
  for (let attempt = 0; attempt < 4; attempt++) {
    let res: Response;
    try {
      res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, target: "user" }),
      });
    } catch {
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      return false;
    }
    if (res.ok) return true;
    if (res.status === 429) {
      const headerRetry = Number(res.headers.get("retry-after"));
      const bodyRetry = await res
        .json()
        .then((j: { retry_after?: number }) => (j?.retry_after ?? 0) * 1000)
        .catch(() => 0);
      const waitMs = Math.max(headerRetry * 1000 || 0, bodyRetry || 0, 2000) + 250;
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }
    return false; // 其它状态码（如 400 超长）不重试
  }
  return false;
}

// 把一批指定码发到 Discord 并标记已发送（自动分片，逐条投递并标记；分片间隔 + 429 重试以避开 webhook 限流）。
async function sendCodesToDiscord(codes: string[]): Promise<SendResult> {
  if (codes.length === 0) return { sent: 0 };

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return { error: "not_configured" };

  const weekDays = passWeekDays();
  const header = passMessageHeader(weekDays);
  const footer = passMessageFooter(weekDays, passCodeMaxUses());
  const chunks = chunkCodesByLimit(codes, header, footer);

  let sent = 0;
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const message = [header, ...chunk.map((c) => `• \`${c}\``), footer].join("\n");
    const ok = await postPassChunk(webhookUrl, message);
    if (!ok) return sent > 0 ? { sent } : { error: "webhook_failed" };
    await markCodesSent(chunk);
    sent += chunk.length;
    // 多条之间稍作停顿，留在 webhook 约 5 次/2 秒的速率窗口内（最后一条不必等）。
    if (i < chunks.length - 1) await new Promise((r) => setTimeout(r, 1000));
  }
  return { sent };
}

// 管理页「发送到 Discord」：现场生成 count 张新码并投递到 Discord（与「批量生成」是两个独立动作，不读取待发送池）。
export async function generateAndSendPassCodes(count: number): Promise<SendResult> {
  const codes = await generatePassCodes(count);
  return sendCodesToDiscord(codes);
}

export type DailyDistributionResult =
  | { generated: number; sent: number }
  | { error: "not_configured" | "webhook_failed" | "unavailable" };

// 每日定时发放：现场生成 DISCORD_PASS_BATCH_SIZE 张新码并投递到 Discord（与后台手动动作一致，只看数量不看发送状态）。
export async function runDailyDistribution(): Promise<DailyDistributionResult> {
  let codes: string[];
  try {
    codes = await generatePassCodes(passBatchDefault());
  } catch {
    return { error: "unavailable" };
  }
  const send = await sendCodesToDiscord(codes);
  if ("error" in send) return send;
  return { generated: codes.length, sent: send.sent };
}

export interface RedeemOutcome {
  status: "ok" | "used" | "invalid" | "unavailable";
  /** 核销成功后该码剩余可用次数 */
  remaining?: number;
}

// 原子扣减一次可用次数：UPDATE 仅在 used_count < max_uses 时生效，
// changes>0 即扣减成功；同一码最多被用满其 max_uses（生成时写入），用完即失效。
export async function redeemPassCode(input: string): Promise<RedeemOutcome> {
  const db = await getD1();
  if (!db) return { status: "unavailable" };
  const normalized = normalizePassCode(input);
  if (!normalized) return { status: "invalid" };

  const res = await db
    .prepare(
      `UPDATE discord_pass_codes SET used_count = used_count + 1
       WHERE REPLACE(code, '-', '') = ? AND used_count < max_uses`,
    )
    .bind(normalized)
    .run();
  const changes = (res.meta as { changes?: number } | undefined)?.changes ?? 0;
  if (changes > 0) {
    // 扣减后立即重读剩余次数（服务端为唯一可信来源）
    const row = await db
      .prepare(
        `SELECT max_uses - used_count AS remaining FROM discord_pass_codes
         WHERE REPLACE(code, '-', '') = ?`,
      )
      .bind(normalized)
      .first<{ remaining: number }>();
    return { status: "ok", remaining: Math.max(0, row?.remaining ?? 0) };
  }

  // 未命中：区分「码不存在」与「次数已用完」
  const row = await db
    .prepare(
      `SELECT used_count, max_uses FROM discord_pass_codes WHERE REPLACE(code, '-', '') = ?`,
    )
    .bind(normalized)
    .first<{ used_count: number; max_uses: number }>();
  if (!row) return { status: "invalid" };
  return { status: "used", remaining: 0 };
}

// ---- 后台鉴权 ----
export function checkAdminToken(token: string | undefined): boolean {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return false;
  return typeof token === "string" && token === expected;
}
