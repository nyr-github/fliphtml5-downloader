// Twitter/X 发帖换免费券：用户提交「帖子链接 + 发帖正文 + 接收邮箱」，
// 后台人工核实帖子确实包含站点链接与介绍后，分配一张专属兑换码（可选自动邮件发放）。
//
// 专属码通过 lib/discord-pass.ts 的 createPrivatePassCode() 生成，生成即标记为已发送，
// 因此不会被每日 cron 广播到 Discord 频道。

import { SITE_URL, DISCORD_INVITE_URL } from "@/lib/constants";
import { createPrivatePassCode, passWeekDays } from "@/lib/discord-pass";

// 复用与 lib/discord-pass.ts 相同的极简 D1 访问方式（项目未引入 @cloudflare/workers-types）。
interface D1Stmt {
    bind(...values: unknown[]): {
        run(): Promise<{ meta?: unknown }>;
        all<T = unknown>(): Promise<{ results?: T[] }>;
        first<T = unknown>(): Promise<T | null>;
    };
}
interface D1Like {
    prepare(query: string): D1Stmt;
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

// Cloudflare Email Sending 发送绑定的极简结构（与上同：项目未引入 @cloudflare/workers-types）。
interface SendEmailLike {
    send(message: {
        to: string;
        from: string;
        subject: string;
        text?: string;
        html?: string;
    }): Promise<unknown>;
}

async function getEmailBinding(): Promise<SendEmailLike | null> {
    try {
        const { getCloudflareContext } = await import("@opennextjs/cloudflare");
        const { env } = getCloudflareContext();
        const emailEnv = env as unknown as Record<string, unknown>;
        return (emailEnv.EMAIL as SendEmailLike) ?? null;
    } catch {
        return null; // 非 Worker 运行时（Vercel / 本地脚本）
    }
}

function nowStamp(): string {
    return new Date().toISOString().replace("T", " ").slice(0, 19);
}

// ---- 校验 ----
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// 仅接受 X（Twitter）的帖子链接；后台审核时会一并核实作者是否关注 @aivaded。
const POST_URL_RE = new RegExp(
    "^https?://" +
    "(?:www\\.|mobile\\.|m\\.)?(?:twitter\\.com|x\\.com)/[A-Za-z0-9_]+/status/\\d+",
    "i",
);

export function validateTweetUrl(url: string): boolean {
    return POST_URL_RE.test(url.trim());
}

export function validateEmail(email: string): boolean {
    return EMAIL_RE.test(email.trim());
}

// 发帖正文须包含站点链接（满足「必须包含网站链接」这一硬性要求）。
export function containsSiteLink(text: string): boolean {
    const host = SITE_URL.replace(/^https?:\/\//, "").toLowerCase();
    const lower = text.toLowerCase();
    return lower.includes(SITE_URL.toLowerCase()) || lower.includes(host);
}

export interface TweetRequestRow {
    id: number;
    tweetUrl: string;
    tweetText: string;
    email: string;
    status: string;
    code: string | null;
    author: string | null;
    authorFollowed: number | null;
    createdAt: string;
    updatedAt: string | null;
}

export type SubmitResult = { ok: true; id: number } | { error: string };

// 提交申请：校验字段、去重（同一邮箱在 pending/approved 期间不可重复；同一帖子链接不可复用）。
export async function submitTweetRequest(input: {
    tweetUrl: string;
    email: string;
    tweetText: string;
}): Promise<SubmitResult> {
    const db = await getD1();
    if (!db) return { error: "unavailable" };

    const tweetUrl = input.tweetUrl.trim();
    const email = input.email.trim().toLowerCase();
    const tweetText = input.tweetText.trim();

    if (!validateTweetUrl(tweetUrl)) return { error: "invalid_tweet_url" };
    if (!validateEmail(email)) return { error: "invalid_email" };
    if (!containsSiteLink(tweetText)) return { error: "missing_link" };

    const dupEmail = await db
        .prepare(
            `SELECT id FROM tweet_pass_requests WHERE email = ? AND status IN ('pending', 'approved') LIMIT 1`,
        )
        .bind(email)
        .first<{ id: number }>();
    if (dupEmail) return { error: "already_requested" };

    const dupUrl = await db
        .prepare(`SELECT id FROM tweet_pass_requests WHERE tweet_url = ? LIMIT 1`)
        .bind(tweetUrl)
        .first<{ id: number }>();
    if (dupUrl) return { error: "tweet_already_used" };

    const ts = nowStamp();
    const res = await db
        .prepare(
            `INSERT INTO tweet_pass_requests (tweet_url, tweet_text, email, status, created_at)
       VALUES (?, ?, ?, 'pending', ?)`,
        )
        .bind(tweetUrl, tweetText, email, ts)
        .run();
    const id =
        (res.meta as { last_row_id?: number } | undefined)?.last_row_id ?? 0;
    return { ok: true, id };
}

export async function listTweetRequests(
    limit = 200,
): Promise<TweetRequestRow[]> {
    const db = await getD1();
    if (!db) return [];
    const res = await db
        .prepare(
            `SELECT id, tweet_url AS tweetUrl, tweet_text AS tweetText, email,
              status, code, author, author_followed AS authorFollowed,
              created_at AS createdAt, updated_at AS updatedAt
       FROM tweet_pass_requests
       ORDER BY (status = 'pending') DESC, created_at DESC LIMIT ?`,
        )
        .bind(limit)
        .all<TweetRequestRow>();
    return res.results ?? [];
}

export type ReviewResult = { ok: true; code?: string } | { error: string };

// 审核通过：分配一张专属码并落库，随后尝试邮件发放（邮件失败不影响审核结果，可在后台复制码手动发送）。
export async function approveTweetRequest(id: number): Promise<ReviewResult> {
    const db = await getD1();
    if (!db) return { error: "unavailable" };

    const row = await db
        .prepare(`SELECT email, status, code FROM tweet_pass_requests WHERE id = ?`)
        .bind(id)
        .first<{ email: string; status: string; code: string | null }>();
    if (!row) return { error: "not_found" };

    // 幂等：已通过且有码则直接返回既有码
    if (row.status === "approved" && row.code) return { ok: true, code: row.code };

    let code: string;
    try {
        code = await createPrivatePassCode();
    } catch {
        return { error: "code_unavailable" };
    }

    const ts = nowStamp();
    await db
        .prepare(
            `UPDATE tweet_pass_requests SET status = 'approved', code = ?, updated_at = ? WHERE id = ?`,
        )
        .bind(code, ts, id)
        .run();

    await sendFreePassEmail(row.email, code); // best-effort
    return { ok: true, code };
}

export async function rejectTweetRequest(id: number): Promise<ReviewResult> {
    const db = await getD1();
    if (!db) return { error: "unavailable" };
    const row = await db
        .prepare(`SELECT email, status FROM tweet_pass_requests WHERE id = ?`)
        .bind(id)
        .first<{ email: string; status: string }>();
    if (!row || row.status === "approved") return { error: "not_found" };
    const ts = nowStamp();
    await db
        .prepare(
            `UPDATE tweet_pass_requests SET status = 'rejected', updated_at = ? WHERE id = ? AND status != 'approved'`,
        )
        .bind(ts, id)
        .run();
    await sendRejectionEmail(row.email); // best-effort
    return { ok: true };
}

// 记录审核时获取到的帖子作者及其是否关注 @aivaded（仅展示，不参与判定）。
export async function recordFollow(
    id: number,
    author: string,
    followed: boolean,
): Promise<void> {
    const db = await getD1();
    if (!db) return;
    await db
        .prepare(`UPDATE tweet_pass_requests SET author = ?, author_followed = ? WHERE id = ?`)
        .bind(author.toLowerCase(), followed ? 1 : 0, id)
        .run();
}

// 可选邮件发放：经 Cloudflare Email Sending（Workers send_email 绑定）自动发信，
// 发件地址取 FREE_PASS_EMAIL_FROM；未配置绑定/发件地址或发送失败一律静默跳过，由后台「复制兑换码」手动发送。
async function sendFreePassEmail(to: string, code: string): Promise<void> {
    const from = process.env.FREE_PASS_EMAIL_FROM;
    if (!from) return;
    const email = await getEmailBinding();
    if (!email) return;
    const subject = "Your free FlipHTML5 Downloader pass code";
    const text = [
        `Thanks for sharing FlipHTML5 Downloader!`,
        ``,
        `Here is your free pass code: ${code}`,
        ``,
        `How to redeem: open ${SITE_URL}, start a download, and enter the code in the unlock dialog. The code activates a ${passWeekDays()}-day unlimited download pass in your browser and can be redeemed up to the limit shown in the dialog.`,
        ``,
        `Questions? Join our Discord: ${DISCORD_INVITE_URL}`,
    ].join("\n");
    try {
        await email.send({ to, from, subject, text });
    } catch {
        // 忽略：审核结果与码已落库，可手动补发
    }
}

// 拒绝通知邮件：告知用户所提交的帖子链接无法访问/核实，请检查后重试。
// 与 sendFreePassEmail 一样为 best-effort，未配置绑定/发件地址或发送失败一律静默跳过。
async function sendRejectionEmail(to: string): Promise<void> {
    const from = process.env.FREE_PASS_EMAIL_FROM;
    if (!from) return;
    const email = await getEmailBinding();
    if (!email) return;
    const subject = "Regarding your FlipHTML5 Downloader free pass request";
    const text = [
        `Thanks for your interest in FlipHTML5 Downloader!`,
        ``,
        `Unfortunately we were unable to access the post link you submitted, so we could not verify it and had to reject this request.`,
        ``,
        `Please make sure the post is publicly viewable (not deleted or set to private), then submit a new request at ${SITE_URL}.`,
        ``,
        `If you have any questions, feel free to reach out: ${DISCORD_INVITE_URL}`,
    ].join("\n");
    try {
        await email.send({ to, from, subject, text });
    } catch {
        // 忽略：拒绝结果已落库，邮件仅作通知
    }
}
