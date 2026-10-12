"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { SITE_URL } from "@/lib/constants";

interface PassRow {
  code: string;
  createdAt: string;
  sentAt: string | null;
  maxUses: number;
  usedCount: number;
}

// 后台从 GET 接口拿到当前生效的运营参数（env 驱动），用于表单默认值与文案展示。
interface PassConfig {
  weekDays: number;
  passMaxUses: number;
  passBatchSize: number;
  passBatchMax: number;
}

const DEFAULT_CONFIG: PassConfig = {
  weekDays: 7,
  passMaxUses: 5,
  passBatchSize: 10,
  passBatchMax: 50,
};

type Notice = { kind: "ok" | "err"; text: string } | null;

// 列表前端分页每页条数。
const PAGE_SIZE = 20;

// X（Twitter）单条推文字符上限。链接在 X 侧固定按 23 字符计，这里按原始长度统计偏保守。
const X_TWEET_LIMIT = 280;

// 组一条可直接粘贴到 X 的推文：文案 + 兑换码 + 站点地址。
// 贪心装入，碰壁即停，保证成品不超 280 字符（剩下的码由提示告知可发第二条）。
function buildXTweet(
  codes: string[],
  maxUses: number,
  weekDays: number,
): { text: string; included: number } {
  const header = `🎁 Free ${weekDays}-Day Pass codes — FlipHTML5 Downloader\n\n`;
  const footer = `\n\nEach code = a ${weekDays}-day unlimited PDF pass, redeemable up to ${maxUses} times (first come, first served).\nRedeem it in the unlock dialog → ${SITE_URL}`;
  const picked: string[] = [];
  for (const code of codes) {
    const candidate = header + picked.concat(code).join("\n") + footer;
    if (candidate.length > X_TWEET_LIMIT) break;
    picked.push(code);
  }
  return { text: header + picked.join("\n") + footer, included: picked.length };
}

// 剪贴板写入：非安全上下文（如通过 http://IP 访问后台）下 navigator.clipboard 不可用，退回 execCommand。
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

function remaining(row: PassRow): number {
  return Math.max(0, row.maxUses - row.usedCount);
}

function StatusBadge({ row }: { row: PassRow }) {
  if (remaining(row) === 0)
    return (
      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-600">
        Used up
      </span>
    );
  if (row.sentAt)
    return (
      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
        {remaining(row)}/{row.maxUses} left
      </span>
    );
  return (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
      Unsent
    </span>
  );
}

export default function AdminPassesPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const api = `/api/admin/${token}/passes`;

  const [rows, setRows] = useState<PassRow[]>([]);
  const [config, setConfig] = useState<PassConfig>(DEFAULT_CONFIG);
  const [count, setCount] = useState(DEFAULT_CONFIG.passBatchSize);
  const [busy, setBusy] = useState<"" | "list" | "generate" | "send">("");
  const [notice, setNotice] = useState<Notice>(null);
  const [page, setPage] = useState(0);
  const countInitialized = useRef(false);

  const refresh = useCallback(async () => {
    setBusy("list");
    try {
      const res = await fetch(api);
      const data = await res.json();
      if (res.ok) {
        setRows(data.codes ?? []);
        setPage(0); // 刷新（含生成/发送后）回到第一页，展示最新一批
        if (data.config) {
          setConfig(data.config);
          // 首次加载用配置的默认数量初始化输入框，之后不再覆盖用户手动修改。
          if (!countInitialized.current) {
            countInitialized.current = true;
            setCount(data.config.passBatchSize ?? DEFAULT_CONFIG.passBatchSize);
          }
        }
      } else setNotice({ kind: "err", text: "Failed to load codes." });
    } catch {
      setNotice({ kind: "err", text: "Failed to load codes." });
    } finally {
      setBusy("");
    }
  }, [api]);

  useEffect(() => {
    // 首次加载放入微任务，避免 effect 体内同步 setState 触发级联渲染
    queueMicrotask(refresh);
  }, [refresh]);

  const runAction = async (action: "generate" | "send") => {
    setBusy(action);
    setNotice(null);
    try {
      const res = await fetch(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, count }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setNotice({
          kind: "err",
          text:
            data.error === "webhook_failed"
              ? "Discord webhook delivery failed; codes were NOT marked sent."
              : `Action failed: ${data.error || res.status}`,
        });
      } else if (action === "generate") {
        setNotice({ kind: "ok", text: `Generated ${data.codes.length} codes.` });
      } else {
        setNotice({
          kind: "ok",
          text: `Generated ${data.generated} code(s) and sent ${data.sent} to Discord.`,
        });
      }
      await refresh();
    } catch {
      setNotice({ kind: "err", text: "Network error, please retry." });
    } finally {
      setBusy("");
    }
  };

  const copyCodes = async () => {
    const unsent = rows.filter((r) => !r.sentAt && remaining(r) > 0).map((r) => r.code);
    if (unsent.length === 0) {
      setNotice({ kind: "err", text: "No unsent codes to copy." });
      return;
    }
    if (!(await copyText(unsent.join("\n")))) {
      setNotice({ kind: "err", text: "Clipboard unavailable, please copy manually." });
      return;
    }
    setNotice({ kind: "ok", text: `Copied ${unsent.length} unsent code(s).` });
  };

  // 复制到 X：把「还有剩余可用次数」的码（含已发 Discord 的，同一批码可跨渠道复用）
  // 组成带网站链接的推文文案写入剪贴板。
  const copyCodesForX = async () => {
    const usable = rows.filter((r) => remaining(r) > 0);
    if (usable.length === 0) {
      setNotice({ kind: "err", text: "No codes with remaining uses." });
      return;
    }
    const { text, included } = buildXTweet(
      usable.map((r) => r.code),
      usable[0].maxUses,
      config.weekDays,
    );
    if (included === 0) {
      setNotice({ kind: "err", text: `Tweet template already exceeds ${X_TWEET_LIMIT} chars, shorten the copy.` });
      return;
    }
    if (!(await copyText(text))) {
      setNotice({ kind: "err", text: "Clipboard unavailable, please copy manually." });
      return;
    }
    const skipped = usable.length - included;
    setNotice({
      kind: "ok",
      text: `Copied ${included} code(s) with site link (${text.length}/${X_TWEET_LIMIT} chars).${skipped ? ` ${skipped} code(s) left out by the limit — post them as another tweet.` : ""
        }`,
    });
  };

  const stats = {
    unsent: rows.filter((r) => !r.sentAt && remaining(r) > 0).length,
    available: rows.reduce((sum, r) => sum + (r.sentAt ? remaining(r) : 0), 0),
    used: rows.reduce((sum, r) => sum + r.usedCount, 0),
  };

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = rows.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Discord Pass Codes</h1>
        <p className="mt-1 text-sm text-gray-500">
          「批量生成」与「发送到 Discord」是两个独立动作：前者只按「数量」生成免费券入库（供手动复制分发）；
          后者则现场生成同样「数量」的新券并推送到 Discord 频道，两者互不影响、也不依赖发送状态。
          每张码最多可用 {config.passMaxUses} 次，每次兑换都会读线上库并扣减一次，用完即失效。
          每天 08:00（北京时间）cron 自动生成并发送 {config.passBatchSize} 张新券到 Discord。
          「复制到 X」会把仍有剩余次数的码组成一条带网站地址的推文文案（限 280 字符）写入剪贴板。
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          数量
          <input
            type="number"
            min={1}
            max={config.passBatchMax}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={() => runAction("generate")}
          disabled={busy !== ""}
          className="rounded-xl bg-[var(--color-primary,#4F46E5)] px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
        >
          {busy === "generate" ? "生成中…" : "批量生成"}
        </button>
        <button
          type="button"
          onClick={() => runAction("send")}
          disabled={busy !== ""}
          className="rounded-xl bg-[#5865F2] px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
        >
          {busy === "send" ? "发送中…" : `发送到 Discord（生成并发送 ${count} 张）`}
        </button>
        <button
          type="button"
          onClick={copyCodes}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          复制未发送码
        </button>
        <button
          type="button"
          onClick={copyCodesForX}
          className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white hover:opacity-90"
        >
          复制到 X（带网站链接）
        </button>
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
        <p
          className={`text-sm ${notice.kind === "ok" ? "text-green-600" : "text-red-500"}`}
        >
          {notice.text}
        </p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 py-3">
          <div className="text-lg font-bold text-amber-700">{stats.unsent}</div>
          <div className="text-xs text-amber-600">未发送</div>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 py-3">
          <div className="text-lg font-bold text-blue-700">{stats.available}</div>
          <div className="text-xs text-blue-600">已发剩余可用次数</div>
        </div>
        <div className="rounded-2xl border border-green-200 bg-green-50 py-3">
          <div className="text-lg font-bold text-green-700">{stats.used}</div>
          <div className="text-xs text-green-600">已兑换总次数</div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Created (UTC)</th>
              <th className="px-4 py-3">Sent (UTC)</th>
              <th className="px-4 py-3">Used</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !busy && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  暂无兑换码，点击「批量生成」创建第一批。
                </td>
              </tr>
            )}
            {pageRows.map((r) => (
              <tr key={r.code} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-2.5 font-mono font-semibold text-gray-900">
                  {r.code}
                </td>
                <td className="px-4 py-2.5 text-gray-600">{r.createdAt}</td>
                <td className="px-4 py-2.5 text-gray-600">{r.sentAt ?? "—"}</td>
                <td className="px-4 py-2.5 text-gray-600">
                  {r.usedCount}/{r.maxUses}
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge row={r} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            第 {safePage + 1} / {totalPages} 页 · 共 {rows.length} 条
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40"
            >
              上一页
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
