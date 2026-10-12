// @aivaded 粉丝列表缓存：经 twitter-api45 followers.php 分页拉取粉丝并落库 D1，
// 供后台批量审核时判断「X 帖子作者是否关注了 @aivaded」（仅展示，不参与通过/拒绝判定）。
// 复用与 lib/tweet-pass.ts 相同的极简 D1 访问方式（项目未引入 @cloudflare/workers-types）。

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
        return null; // 非 Worker 运行时
    }
}

const API_HOST = "twitter-api45.p.rapidapi.com";
const TARGET_SCREEN_NAME = "aivaded"; // 被关注的官方账号
const MAX_PAGES = 60; // 翻页安全上限，防止超大账号或游标异常导致无限循环

interface FollowerUser {
    user_id: string;
    screen_name: string;
    name: string | null;
}

function nowStamp(): string {
    return new Date().toISOString().replace("T", " ").slice(0, 19);
}

// 拉取一页粉丝。followers.php 用 more_users 表示是否还有下一页，游标字段命名不固定，做多键兜底。
async function fetchFollowersPage(
    cursor?: string,
): Promise<{ users: FollowerUser[]; moreUsers: boolean; nextCursor?: string } | null> {
    const key = process.env.RAPIDAPI_TWITTER_KEY;
    if (!key) return null;
    const params = new URLSearchParams({
        screenname: TARGET_SCREEN_NAME,
        blue_verified: "0",
    });
    if (cursor) params.set("cursor", cursor);
    try {
        const res = await fetch(`https://${API_HOST}/followers.php?${params.toString()}`, {
            headers: { "x-rapidapi-host": API_HOST, "x-rapidapi-key": key },
            cache: "no-store",
        });
        if (!res.ok) return null;
        const data = (await res.json()) as Record<string, any>;
        if (data.status === "error" || !Array.isArray(data.followers)) return null;
        const users: FollowerUser[] = data.followers
            .filter((u: any) => u && u.user_id)
            .map((u: any) => ({
                user_id: String(u.user_id),
                screen_name: String(u.screen_name ?? "").toLowerCase(),
                name: u.name ?? null,
            }));
        const rawCursor = data.next_cursor ?? data.nextCursor ?? data.cursor;
        return {
            users,
            moreUsers: Boolean(data.more_users),
            nextCursor: rawCursor != null && rawCursor !== "" ? String(rawCursor) : undefined,
        };
    } catch {
        return null;
    }
}

async function upsertFollowers(db: D1Like, users: FollowerUser[]): Promise<void> {
    const ts = nowStamp();
    for (const u of users) {
        if (!u.screen_name) continue;
        await db
            .prepare(
                `INSERT INTO x_followers (user_id, screen_name, name, synced_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET screen_name = excluded.screen_name, name = excluded.name, synced_at = excluded.synced_at`,
            )
            .bind(u.user_id, u.screen_name, u.name, ts)
            .run();
    }
}

async function isFollowerCached(db: D1Like, screenName: string): Promise<boolean> {
    const row = await db
        .prepare(`SELECT 1 AS hit FROM x_followers WHERE screen_name = ? LIMIT 1`)
        .bind(screenName.toLowerCase())
        .first<{ hit: number }>();
    return !!row;
}

export interface RefreshResult {
    pages: number;
    total: number;
    found: boolean;
    error?: string;
}

// 分页刷新粉丝列表并落库。给定 stopAtScreenName 时，一旦该用户入库即停止翻页（提前收敛）。
export async function refreshFollowers(stopAtScreenName?: string): Promise<RefreshResult> {
    const db = await getD1();
    if (!db) return { pages: 0, total: 0, found: false, error: "db_unavailable" };
    if (!process.env.RAPIDAPI_TWITTER_KEY)
        return { pages: 0, total: 0, found: false, error: "no_key" };

    const target = stopAtScreenName?.toLowerCase();
    let cursor: string | undefined;
    let pages = 0;
    let total = 0;
    let found = false;

    while (pages < MAX_PAGES) {
        const page = await fetchFollowersPage(cursor);
        if (!page) break;
        await upsertFollowers(db, page.users);
        total += page.users.length;
        pages++;
        if (target) {
            found = await isFollowerCached(db, target);
            if (found) break; // 数据库已包含目标记录，停止翻页
        }
        if (!page.moreUsers || !page.nextCursor) break;
        cursor = page.nextCursor;
    }

    if (target && !found) found = await isFollowerCached(db, target);
    return { pages, total, found };
}

// 判断作者是否在粉丝列表内。
//  - supplement=true（默认，单条手动检查）：先查库，未命中则翻页补充直到库中包含该记录或翻完。
//  - supplement=false（批量场景，已在本批开始整体刷新过）：仅查库，避免对每个未关注作者重复全量翻页。
export async function checkAuthorFollows(
    screenName: string,
    opts: { supplement?: boolean } = {},
): Promise<{ followed: boolean }> {
    const db = await getD1();
    if (!db) return { followed: false };
    const sn = screenName.toLowerCase();
    if (await isFollowerCached(db, sn)) return { followed: true };
    if (opts.supplement === false) return { followed: false };
    const r = await refreshFollowers(sn);
    return { followed: r.found };
}
