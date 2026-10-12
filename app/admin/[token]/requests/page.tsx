"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface TweetRequestRow {
    id: number;
    tweetUrl: string;
    tweetText: string;
    email: string;
    status: string;
    code: string | null;
    author?: string | null;
    authorFollowed?: number | null;
    createdAt: string;
    updatedAt: string | null;
}

type Notice = { kind: "ok" | "err"; text: string } | null;

type Tab = "pending" | "approved" | "rejected";

const PAGE_SIZE = 20;

// 剪贴板写入：非安全上下文（http://IP 访问后台）下 navigator.clipboard 不可用时退回 execCommand。
async function copyText(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        try {
            const ta = document.createElement("textarea");
            ta.value = text;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            const ok = document.execCommand("copy");
            document.body.removeChild(ta);
            return ok;
        } catch {
            return false;
        }
    }
}

// 从帖子链接识别发布社区（与 lib/tweet-pass.ts 的 POST_URL_RE 支持的 platforms 保持一致）。
const PLATFORMS: { test: RegExp; label: string; cls: string }[] = [
    { test: /(?:twitter|x)\.com/i, label: "X", cls: "bg-gray-900 text-white" },
    { test: /threads\.(?:net|com)/i, label: "Threads", cls: "bg-gray-200 text-gray-900" },
    { test: /reddit\.com/i, label: "Reddit", cls: "bg-orange-100 text-orange-700" },
    { test: /facebook\.com/i, label: "Facebook", cls: "bg-blue-100 text-blue-700" },
    { test: /tiktok\.com/i, label: "TikTok", cls: "bg-pink-100 text-pink-700" },
];

function detectPlatform(url: string): { label: string; cls: string } {
    return (
        PLATFORMS.find((p) => p.test.test(url)) ?? {
            label: "其他",
            cls: "bg-gray-100 text-gray-600",
        }
    );
}

// 从 X 帖子链接提取数字 id（/status/<id>）。
function extractTweetId(url: string): string | null {
    const m = url.match(/\/status\/([0-9]+)/i);
    return m ? m[1] : null;
}

// 将 twitter-api45 的 tweet.php 响应解读为“是否可访问 + 简要证据”。
// 响应字段命名不统一，按多种常见键兜底。
function interpretTweet(data: unknown): { valid: boolean; detail: string } {
    if (!data || typeof data !== "object") return { valid: false, detail: "未获取到帖子数据" };
    const d = data as Record<string, any>;
    // 该 API 用 status:"error" 标识拉取失败（且总回显请求的 id，不能据此判定存在）。
    if (d.status === "error" || d.error)
        return { valid: false, detail: "帖子无法访问或不存在" };
    // 真实可访问的帖子应有正文/作者/发布时间之一，均以 null 或空串为缺数据。
    const text = d.text || d.display_text || d.full_text || "";
    const created = d.created_at || d.date_created || "";
    const user =
        d.author?.screen_name ||
        d.user?.screen_name ||
        d.user?.name ||
        d.screen_name ||
        "";
    if (!text && !created && !user)
        return { valid: false, detail: "帖子不存在或已删除" };
    const parts: string[] = [];
    if (user) parts.push(`@${user}`);
    if (created) parts.push(String(created));
    if (text) parts.push(String(text).slice(0, 60));
    return { valid: true, detail: parts.join(" · ") || "帖子可访问" };
}

function StatusBadge({ status }: { status: string }) {
    if (status === "approved")
        return (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                已通过
            </span>
        );
    if (status === "rejected")
        return (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                已拒绝
            </span>
        );
    return (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
            待审核
        </span>
    );
}

export default function AdminRequestsPage() {
    const params = useParams<{ token: string }>();
    const token = params.token;
    const api = `/api/admin/${token}/requests`;

    const [rows, setRows] = useState<TweetRequestRow[]>([]);
    const [busy, setBusy] = useState<"" | "list" | "batch" | "auto">("");
    const [notice, setNotice] = useState<Notice>(null);
    // 展开查看正文的行 id
    const [expanded, setExpanded] = useState<Set<number>>(new Set());
    // 状态分 tab 与分页
    const [tab, setTab] = useState<Tab>("pending");
    const [page, setPage] = useState(1);
    // 单行审核中状态：按 `动作-行id` 独立维护，使通过/拒绝互不影响。
    const [rowBusy, setRowBusy] = useState<Record<string, boolean>>({});
    // X 帖子有效性 + 作者关注状态检查结果（按行 id，仅展示，不影响判定）
    const [checks, setChecks] = useState<
        Record<
            number,
            {
                loading: boolean;
                msg?: string;
                valid?: boolean;
                author?: string | null;
                followed?: boolean | null;
                followLoading?: boolean;
            }
        >
    >({});

    const refresh = useCallback(async () => {
        setBusy("list");
        try {
            const res = await fetch(api);
            const data = await res.json();
            if (res.ok) setRows(data.requests ?? []);
            else setNotice({ kind: "err", text: "加载失败。" });
        } catch {
            setNotice({ kind: "err", text: "加载失败。" });
        } finally {
            setBusy("");
        }
    }, [api]);

    useEffect(() => {
        queueMicrotask(refresh);
    }, [refresh]);

    const runAction = async (action: "approve" | "reject", id: number) => {
        const key = `${action}-${id}`;
        setRowBusy((p) => ({ ...p, [key]: true }));
        setNotice(null);
        try {
            const res = await fetch(api, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, id }),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                setNotice({
                    kind: "err",
                    text: `操作失败：${data.error || res.status}`,
                });
            } else if (action === "approve") {
                setNotice({
                    kind: "ok",
                    text: `已通过并分配兑换码 ${data.code}（系统会尝试自动邮件发放；若未配置邮件通道，请复制码后手动发送给该邮箱）`,
                });
            } else {
                setNotice({
                    kind: "ok",
                    text: "已拒绝，系统会尝试邮件通知用户（帖子无法访问，请重试）；若未配置邮件通道则不会发送。",
                });
            }
            await refresh();
        } catch {
            setNotice({ kind: "err", text: "网络错误，请重试。" });
        } finally {
            setRowBusy((p) => ({ ...p, [key]: false }));
        }
    };

    const copyCode = async (code: string) => {
        if (!(await copyText(code))) {
            setNotice({ kind: "err", text: "剪贴板不可用，请手动复制。" });
            return;
        }
        setNotice({ kind: "ok", text: `已复制兑换码 ${code}。` });
    };

    // 经服务端代理（/api/admin/*/requests/check-tweet）校验 X 帖子是否可访问。
    const runCheck = async (r: TweetRequestRow) => {
        const id = extractTweetId(r.tweetUrl);
        if (!id) {
            setChecks((p) => ({ ...p, [r.id]: { loading: false, msg: "无法从链接解析帖子ID", valid: false } }));
            return;
        }
        setChecks((p) => ({ ...p, [r.id]: { loading: true } }));
        try {
            const res = await fetch(`${api}/check-tweet`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                setChecks((p) => ({ ...p, [r.id]: { loading: false, msg: `检查失败：${data.error || res.status}`, valid: false } }));
                return;
            }
            const { valid, detail } = interpretTweet(data.data);
            const author = (data.author as string | null) ?? null;
            setChecks((p) => ({ ...p, [r.id]: { loading: false, msg: detail, valid, author, followed: valid ? null : undefined } }));
            // 帖子有效且有作者时补查关注状态（单条手动：由服务端翻页补充直到库中含该记录）。
            if (valid && author) {
                setChecks((p) => ({ ...p, [r.id]: { ...p[r.id], followLoading: true } }));
                try {
                    const fr = await fetch(`${api}/follow-check`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ screenName: author, requestId: r.id }),
                    });
                    const fd = await fr.json();
                    setChecks((p) => ({ ...p, [r.id]: { ...p[r.id], followLoading: false, followed: fd.ok ? !!fd.followed : undefined } }));
                } catch {
                    setChecks((p) => ({ ...p, [r.id]: { ...p[r.id], followLoading: false, followed: undefined } }));
                }
            }
        } catch {
            setChecks((p) => ({ ...p, [r.id]: { loading: false, msg: "网络错误，请重试", valid: false } }));
        }
    };

    const toggle = (id: number) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const counts: Record<Tab, number> = {
        pending: rows.filter((r) => r.status === "pending").length,
        approved: rows.filter((r) => r.status === "approved").length,
        rejected: rows.filter((r) => r.status === "rejected").length,
    };

    const filtered = rows.filter((r) => r.status === tab);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const paged = filtered.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
    );

    const switchTab = (next: Tab) => {
        setTab(next);
        setPage(1);
    };

    // 批量目标：所有未审核行（无需勾选）。
    const pendingIds = rows.filter((r) => r.status === "pending").map((r) => r.id);

    // 批量通过：前端 ajax 逐个串行调用 approve（每个都会独立分配兑换码并尝试邮件发放）。
    const batchApprove = async () => {
        const ids = pendingIds;
        if (ids.length === 0) return;
        setBusy("batch");
        setNotice(null);
        let ok = 0;
        let fail = 0;
        for (let i = 0; i < ids.length; i++) {
            setNotice({ kind: "ok", text: `批量通过中… ${i + 1}/${ids.length}` });
            try {
                const res = await fetch(api, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "approve", id: ids[i] }),
                });
                const data = await res.json();
                if (res.ok && data.ok) ok++;
                else fail++;
            } catch {
                fail++;
            }
        }
        setNotice({
            kind: fail > 0 ? "err" : "ok",
            text: `批量通过完成：成功 ${ok} 个${fail > 0 ? `，失败 ${fail} 个` : ""}（每个均会尝试邮件发放兑换码）。`,
        });
        await refresh();
        setBusy("");
    };

    // 批量自动审核：对所有未审核行先查 X 帖子有效性，有效则通过、无法访问则拒绝（非 X 平台无法自动判定，跳过交人工）。
    // 前端 ajax 按顺序逐个处理；拒绝/通过各自计数。
    const batchAutoReview = async () => {
        const ids = pendingIds;
        if (ids.length === 0) return;
        setBusy("auto");
        setNotice(null);
        // 每次批量审核前至少调用一次接口整体刷新 @aivaded 粉丝列表并落库（尽力而为，失败不阻断审核）。
        try {
            await fetch(`${api}/follow-refresh`, { method: "POST" });
        } catch {
            // ignore
        }
        let approved = 0;
        let rejected = 0;
        let skipped = 0;
        let failed = 0;
        for (let i = 0; i < ids.length; i++) {
            const row = rows.find((r) => r.id === ids[i]);
            setNotice({ kind: "ok", text: `自动审核中… ${i + 1}/${ids.length}` });
            if (!row || row.status !== "pending" || detectPlatform(row.tweetUrl).label !== "X") {
                skipped++;
                continue;
            }
            const tweetId = extractTweetId(row.tweetUrl);
            if (!tweetId) {
                skipped++;
                continue;
            }
            try {
                const res = await fetch(`${api}/check-tweet`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: tweetId }),
                });
                const data = await res.json();
                if (!res.ok || !data.ok) {
                    failed++;
                    continue;
                }
                const inter = interpretTweet(data.data);
                const action = inter.valid ? "approve" : "reject";
                const reviewRes = await fetch(api, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action, id: row.id }),
                });
                const reviewData = await reviewRes.json();
                if (!reviewRes.ok || !reviewData.ok) {
                    failed++;
                    continue;
                }
                if (inter.valid) approved++;
                else rejected++;
                // 记录作者关注状态（本批已整体刷新，仅查库即可，dbOnly）——仅展示，不影响判定。
                const author = (data.author as string | null) ?? null;
                if (inter.valid && author) {
                    setChecks((p) => ({ ...p, [row.id]: { loading: false, msg: inter.detail, valid: true, author, followed: null } }));
                    try {
                        const fr = await fetch(`${api}/follow-check`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ screenName: author, dbOnly: true, requestId: row.id }),
                        });
                        const fd = await fr.json();
                        setChecks((p) => ({ ...p, [row.id]: { ...p[row.id], followed: fd.ok ? !!fd.followed : undefined } }));
                    } catch {
                        // ignore
                    }
                }
            } catch {
                failed++;
            }
        }
        const summary = `自动审核完成：通过 ${approved}、拒绝 ${rejected}、跳过 ${skipped}${failed > 0 ? `、失败 ${failed}` : ""}`;
        setNotice({
            kind: failed > 0 ? "err" : "ok",
            text: skipped > 0 ? `${summary}（跳过项为非 X 平台或无法解析，需人工审核）` : summary,
        });
        await refresh();
        setBusy("");
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-gray-900">Twitter Pass Requests</h1>
                <p className="mt-1 text-sm text-gray-500">
                    用户发帖介绍本站（含网站链接）后提交帖子链接与接收邮箱。请点开正文核实帖子确实包含链接与介绍，
                    再「通过」分配一张专属兑换码（该码不会进入 Discord 定时广播），系统会尝试邮件发放；未配置邮件通道时可复制码手动发送。
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1">
                    {(
                        [
                            { key: "pending", label: "未审核" },
                            { key: "approved", label: "通过" },
                            { key: "rejected", label: "拒绝" },
                        ] as const
                    ).map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => switchTab(t.key)}
                            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${tab === t.key
                                ? "bg-[var(--color-primary,#4F46E5)] text-white"
                                : "text-gray-600 hover:bg-gray-100"
                                }`}
                        >
                            {t.label}
                            <span className="ml-1.5 text-xs opacity-80">
                                {counts[t.key]}
                            </span>
                        </button>
                    ))}
                </div>
                {tab === "pending" && (
                    <button
                        type="button"
                        onClick={batchApprove}
                        disabled={busy !== "" || counts.pending === 0}
                        className="rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
                    >
                        {busy === "batch" ? "处理中…" : `批量通过 (${counts.pending})`}
                    </button>
                )}
                {tab === "pending" && (
                    <button
                        type="button"
                        onClick={batchAutoReview}
                        disabled={busy !== "" || counts.pending === 0}
                        className="rounded-xl bg-[var(--color-primary,#4F46E5)] px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
                    >
                        {busy === "auto" ? "审核中…" : `批量自动审核 (${counts.pending})`}
                    </button>
                )}
                <button
                    type="button"
                    onClick={refresh}
                    disabled={busy !== ""}
                    className="ml-auto rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                    {busy === "list" ? "刷新中…" : "刷新"}
                </button>
            </div>

            {notice && (
                <p className={`text-sm ${notice.kind === "ok" ? "text-green-600" : "text-red-500"}`}>
                    {notice.text}
                </p>
            )}

            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wider text-gray-500">
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Platform</th>
                            <th className="px-4 py-3">Follow</th>
                            <th className="px-4 py-3">Post</th>
                            <th className="px-4 py-3">Created (UTC)</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Code</th>
                            <th className="px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paged.length === 0 && busy !== "list" && (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                                    暂无记录。
                                </td>
                            </tr>
                        )}
                        {paged.map((r) => {
                            const isOpen = expanded.has(r.id);
                            return (
                                <tr key={r.id} className="border-b border-gray-50 align-top hover:bg-gray-50">
                                    <td className="px-4 py-2.5 font-mono text-gray-900">{r.email}</td>
                                    <td className="px-4 py-2.5">
                                        {(() => {
                                            const p = detectPlatform(r.tweetUrl);
                                            const c = checks[r.id];
                                            return (
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.cls}`}
                                                        >
                                                            {p.label}
                                                        </span>
                                                        {p.label === "X" && (
                                                            <button
                                                                type="button"
                                                                onClick={() => runCheck(r)}
                                                                disabled={c?.loading}
                                                                className="rounded-lg border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                                                            >
                                                                {c?.loading ? "检查中…" : "检查有效性"}
                                                            </button>
                                                        )}
                                                    </div>
                                                    {c && !c.loading && c.msg && (
                                                        <span
                                                            className={`text-xs ${c.valid ? "text-green-600" : "text-red-500"}`}
                                                        >
                                                            {c.valid ? "✓ " : "✕ "}
                                                            {c.msg}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        {(() => {
                                            if (detectPlatform(r.tweetUrl).label !== "X")
                                                return <span className="text-gray-400">—</span>;
                                            const c = checks[r.id];
                                            const author = c?.author ?? r.author ?? null;
                                            const followed =
                                                c?.followed ??
                                                (r.authorFollowed === 1
                                                    ? true
                                                    : r.authorFollowed === 0
                                                        ? false
                                                        : undefined);
                                            return (
                                                <div className="flex flex-col gap-1">
                                                    {author && (
                                                        <span className="font-mono text-xs text-gray-500">@{author}</span>
                                                    )}
                                                    {c?.followLoading ? (
                                                        <span className="text-xs text-gray-400">关注检查中…</span>
                                                    ) : followed === true ? (
                                                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                                                            已关注
                                                        </span>
                                                    ) : followed === false ? (
                                                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                                                            未关注
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">未检查</span>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <a
                                            href={r.tweetUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[var(--color-primary,#4F46E5)] hover:underline"
                                        >
                                            查看帖子 ↗
                                        </a>
                                        <button
                                            type="button"
                                            onClick={() => toggle(r.id)}
                                            className="ml-2 text-xs text-gray-500 hover:text-gray-800"
                                        >
                                            {isOpen ? "收起正文" : "展开正文"}
                                        </button>
                                        {isOpen && (
                                            <p className="mt-1 max-w-md whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-2 text-xs text-gray-600">
                                                {r.tweetText}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-4 py-2.5 text-gray-600">{r.createdAt}</td>
                                    <td className="px-4 py-2.5">
                                        <StatusBadge status={r.status} />
                                    </td>
                                    <td className="px-4 py-2.5">
                                        {r.code ? (
                                            <button
                                                type="button"
                                                onClick={() => copyCode(r.code as string)}
                                                className="font-mono text-xs font-semibold text-gray-900 hover:underline"
                                                title="点击复制"
                                            >
                                                {r.code}
                                            </button>
                                        ) : (
                                            <span className="text-gray-400">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        {r.status === "pending" ? (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => runAction("approve", r.id)}
                                                    disabled={busy === "batch" || busy === "auto" || rowBusy[`approve-${r.id}`]}
                                                    className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
                                                >
                                                    {rowBusy[`approve-${r.id}`] ? "处理中…" : "通过"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => runAction("reject", r.id)}
                                                    disabled={busy === "batch" || busy === "auto" || rowBusy[`reject-${r.id}`]}
                                                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                                                >
                                                    {rowBusy[`reject-${r.id}`] ? "处理中…" : "拒绝"}
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400">
                                                {r.updatedAt ?? "—"}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 text-sm">
                    <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage <= 1}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                        上一页
                    </button>
                    <span className="text-gray-500">
                        第 {currentPage} / {totalPages} 页
                    </span>
                    <button
                        type="button"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                        下一页
                    </button>
                </div>
            )}
        </div>
    );
}
