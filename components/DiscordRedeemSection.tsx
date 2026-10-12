"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ExternalLink, Gift, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { activateWeeklyPass } from "@/lib/payment-db";
import { DISCORD_INVITE_URL, X_PROFILE_URL } from "@/lib/constants";

interface DiscordRedeemSectionProps {
    /** 兑换成功（周卡已写入）后的回调，用于关闭弹窗 / 刷新页面状态 */
    onRedeemed: () => void;
    /** 每次激活的周卡天数（来自 /api/payment/config） */
    weekDays: number;
    /** 每日发放的码数量（用于引导文案） */
    batchSize: number;
}

// 社区码（Discord / X 发放）兑换：服务端读线上库确认剩余可用次数并原子扣减 1（每张码限用次数）→ 本地激活周卡。
export default function DiscordRedeemSection({
    onRedeemed,
    weekDays,
    batchSize,
}: DiscordRedeemSectionProps) {
    const [code, setCode] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const handleRedeem = async () => {
        const trimmed = code.trim();
        if (!trimmed || busy) return;
        setBusy(true);
        setError("");
        try {
            const res = await fetch("/api/discord/redeem", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: trimmed }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.ok) {
                activateWeeklyPass(weekDays);
                setCode("");
                toast.success("Weekly pass activated", {
                    description: `Community code redeemed — unlimited downloads for the next ${weekDays} days in this browser.${typeof data.remaining === "number"
                        ? ` This code has ${data.remaining} use(s) left.`
                        : ""
                        }`,
                });
                onRedeemed();
                return;
            }
            setError(
                data.error === "code_used_up"
                    ? "This code has used up all its redemptions."
                    : data.error === "invalid_code"
                        ? "This code is not valid."
                        : "Redemption is unavailable right now.",
            );
        } catch {
            setError("Redemption is unavailable right now.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-1.5">
            <div className="flex items-center gap-2">
                <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleRedeem();
                    }}
                    placeholder="Community pass code (e.g. FLIP-XXXXXXXX)"
                    className="flex-1 min-w-0 rounded-xl border border-gray-200 px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
                />
                <button
                    type="button"
                    onClick={handleRedeem}
                    disabled={busy || !code.trim()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#5865F2] px-3.5 py-2 text-xs sm:text-sm font-bold text-white hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {busy ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Gift className="w-4 h-4" />
                    )}
                    Redeem Code
                </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <a
                    href={DISCORD_INVITE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center gap-0.5 rounded-xl bg-[#5865F2] px-3 py-2.5 text-center font-bold text-white hover:opacity-90 active:scale-95 transition-all"
                >
                    <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm">
                        <ExternalLink className="w-3.5 h-3.5" />
                        Join our Discord
                    </span>
                    <span className="text-[10px] font-normal text-white/80">
                        {batchSize} free {weekDays}-day codes daily
                    </span>
                </a>
                <Link
                    href="/free-pass"
                    className="flex flex-col items-center justify-center gap-0.5 rounded-xl bg-[var(--color-primary)] px-3 py-2.5 text-center font-bold text-white hover:opacity-90 active:scale-95 transition-all"
                >
                    <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm">
                        <Gift className="w-3.5 h-3.5" />
                        Earn a pass on X
                    </span>
                    <span className="text-[10px] font-normal text-white/80">
                        Post &amp; get a free code
                    </span>
                </Link>
            </div>
            {error && (
                <p className="text-[11px] text-red-500 leading-relaxed">{error}</p>
            )}
        </div>
    );
}
