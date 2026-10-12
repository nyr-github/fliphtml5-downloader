"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Loader2, Lock, ExternalLink, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import DiscordRedeemSection from "./DiscordRedeemSection";
import { paymentDB, activateWeeklyPass } from "@/lib/payment-db";

export type PassType = "single" | "week";

export interface PendingOrder {
    orderNumber: string;
    orderId?: string;
    bookKey: string;
    url: string;
    type: PassType;
}

const PENDING_KEY = "fbl_pendingOrder";

interface PriceConfig {
    single: number;
    week: number;
    debug: boolean;
    /** 服务端 FREE_ONCE_EVERYDAY 开关，false = 取消每日免费额度 */
    dailyFree: boolean;
    /** 服务端 FREE_CODE_ENABLE 开关，false = 隐藏免费券兑换入口 */
    freeCode: boolean;
    /** 服务端 PAYMENT_ENABLE 开关，false = 关闭支付入口（仅保留免费券） */
    payment: boolean;
    /** 周卡天数（每次激活/支付写入的天数），与兑换服务端同源 */
    weekDays: number;
    /** 每张码可用次数 */
    passMaxUses: number;
    /** 每日自动发放的码数量 */
    passBatchSize: number;
    /** 单批生成与每日投递上限 */
    passBatchMax: number;
}

const DEFAULT_PRICES: PriceConfig = {
    single: 100,
    week: 500,
    debug: false,
    dailyFree: true,
    freeCode: true,
    payment: true,
    weekDays: 7,
    passMaxUses: 5,
    passBatchSize: 10,
    passBatchMax: 50,
};

let configCache: Promise<PriceConfig> | null = null;

// 拉取一次并缓存：付费弹窗与下载付费墙门控共用，避免重复请求与口径不一。
// 读取失败（或旧版本无 dailyFree/payment 字段）按默认策略处理，不阻断下载。
export function loadPaymentConfig(): Promise<PriceConfig> {
    if (!configCache) {
        configCache = fetch("/api/payment/config")
            .then((r) => (r.ok ? (r.json() as Promise<PriceConfig>) : null))
            .then((d) =>
                d && typeof d.single === "number"
                    ? { ...DEFAULT_PRICES, ...d, payment: d.payment !== false }
                    : DEFAULT_PRICES,
            )
            .catch(() => {
                configCache = null;
                return DEFAULT_PRICES;
            });
    }
    return configCache;
}

export async function isDailyFreeEnabled(): Promise<boolean> {
    const cfg = await loadPaymentConfig();
    return cfg.dailyFree !== false;
}

function formatUsd(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
}

export function getPendingOrder(): PendingOrder | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(PENDING_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as PendingOrder & { type?: PassType };
        // 兼容旧数据（无 type 字段）
        if (!parsed.type) parsed.type = "single";
        return parsed as PendingOrder;
    } catch {
        return null;
    }
}

export function clearPendingOrder(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(PENDING_KEY);
}

// 单次核验订单状态（服务端会顺带触发 verify-payment 兑底）。
export async function checkOrderStatus(
    pending: PendingOrder,
): Promise<"paid" | "failed" | "pending"> {
    try {
        const qs = new URLSearchParams({ order_number: pending.orderNumber });
        if (pending.orderId) qs.set("order_id", pending.orderId);
        const res = await fetch(`/api/payment/status?${qs.toString()}`);
        if (!res.ok) return "pending";
        const data = await res.json();
        return data.status === "paid" || data.status === "failed"
            ? data.status
            : "pending";
    } catch {
        return "pending";
    }
}

// 支付成功后写入授权（单书许可 / 周卡）。弹窗轮询与 callback 落地页共用。
export async function finalizePaidOrder(pending: PendingOrder): Promise<void> {
    if (pending.type === "week") {
        const { weekDays } = await loadPaymentConfig();
        activateWeeklyPass(weekDays);
        toast.success("Weekly pass activated", {
            description: `Unlimited downloads for the next ${weekDays} days in this browser.`,
        });
    } else {
        await paymentDB.saveLicense({
            bookKey: pending.bookKey,
            orderNumber: pending.orderNumber,
            paidAt: new Date().toISOString(),
        });
        toast.success("Payment confirmed", {
            description: "This file is now unlocked.",
        });
    }
    clearPendingOrder();
}

type Stage = "idle" | "creating" | "waiting" | "error";

interface PayModalProps {
    open: boolean;
    /** 待解锁文件标识 */
    bookKey: string;
    /** 支付成功后需要继续下载的 URL */
    url: string;
    /** 兜底场景（支付未即时确认）携带的未完成订单，弹窗内继续轮询 */
    resumeOrder?: PendingOrder | null;
    /** 支付并写入许可成功后回调 */
    onSuccess: (bookKey: string, url: string) => void;
    onClose: () => void;
}

export default function PayModal({
    open,
    bookKey,
    url,
    resumeOrder,
    onSuccess,
    onClose,
}: PayModalProps) {
    const [stage, setStage] = useState<Stage>(resumeOrder ? "waiting" : "idle");
    const [order, setOrder] = useState<PendingOrder | null>(resumeOrder ?? null);
    const [error, setError] = useState<string>("");
    const [prices, setPrices] = useState<PriceConfig>(DEFAULT_PRICES);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        loadPaymentConfig().then(setPrices);
    }, []);

    const stopPolling = useCallback(() => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    }, []);

    const finalizePaid = useCallback(
        async (paidOrder: PendingOrder) => {
            stopPolling();
            await finalizePaidOrder(paidOrder);
            onSuccess(paidOrder.bookKey, paidOrder.url);
        },
        [onSuccess, stopPolling],
    );

    const pollStatus = useCallback(
        (pending: PendingOrder) => {
            stopPolling();
            pollRef.current = setInterval(async () => {
                const status = await checkOrderStatus(pending);
                if (status === "paid") {
                    await finalizePaid(pending);
                } else if (status === "failed") {
                    stopPolling();
                    setStage("error");
                    setError("Payment failed. Please try again.");
                }
            }, 3000);
        },
        [finalizePaid, stopPolling],
    );

    // 刷新后恢复场景：携带未完成订单时直接开始轮询（stage/order 已由 props 初始化）。
    useEffect(() => {
        if (open && resumeOrder) {
            pollStatus(resumeOrder);
        }
        return () => stopPolling();
    }, [open, resumeOrder, pollStatus, stopPolling]);

    // ESC 关闭 + 锁滚动
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [open, onClose]);

    const handlePay = useCallback(
        async (type: PassType) => {
            setStage("creating");
            setError("");
            try {
                const res = await fetch("/api/payment/create-order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ bookKey, type }),
                });
                const data = await res.json();
                if (!res.ok || !data.paymentUrl) {
                    throw new Error(data.error || "Unable to start payment.");
                }
                const pending: PendingOrder = {
                    orderNumber: data.orderNumber,
                    orderId: data.orderId,
                    bookKey,
                    url,
                    type: (data.type as PassType) ?? type,
                };
                setOrder(pending);
                // 同标签跳转支付；订单先落盘，callback 回跳后由落地页核验并自动开始下载。
                localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
                window.location.href = data.paymentUrl;
            } catch (err) {
                setStage("error");
                setError(
                    err instanceof Error ? err.message : "Unable to start payment.",
                );
            }
        },
        [bookKey, url],
    );

    const handleRetry = useCallback(() => {
        setStage("idle");
        setError("");
    }, []);

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        key="pay-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
                    />
                    <div className="fixed inset-0 z-[101] overflow-y-auto overscroll-contain">
                        <div className="min-h-full flex items-center justify-center p-4 pointer-events-none">
                            <motion.div
                                key="pay-dialog"
                                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="pointer-events-auto w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
                                role="dialog"
                                aria-modal="true"
                                aria-label="Unlock download"
                            >
                                <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100">
                                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                                        <Lock className="w-5 h-5 text-[var(--color-primary)]" />
                                        Unlock PDF Download
                                    </h2>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                                        aria-label="Close"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="px-4 sm:px-6 py-4 sm:py-6">
                                    {stage === "idle" && (
                                        <div className="text-center space-y-3">
                                            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed text-left">
                                                {!prices.payment
                                                    ? prices.freeCode
                                                        ? "Payment is temporarily closed. For now you can unlock downloads with the free vouchers we drop on Discord and X:"
                                                        : "Payment is temporarily closed. Please check back later."
                                                    : prices.dailyFree
                                                      ? "PDF conversion runs on our servers. Your first download each day is free — after that, pick one:"
                                                      : "PDF conversion runs on our servers, and every download needs an unlock — pick one:"}
                                            </p>

                                            {prices.debug && prices.payment && (
                                                <div className="rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1.5 text-[11px] text-amber-800 leading-snug text-left">
                                                    <span className="font-semibold">PAY DEBUG</span> ·
                                                    Both prices reduced to{" "}
                                                    {formatUsd(prices.single)} for
                                                    payment-flow testing.
                                                </div>
                                            )}

                                            {prices.payment && (
                                                <div className="space-y-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handlePay("week")}
                                                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white text-sm sm:text-base font-bold hover:shadow-lg active:scale-95 transition-all"
                                                    >
                                                        <Sparkles className="w-4 h-4" />
                                                        {formatUsd(prices.week)} · Unlimited{" "}
                                                        {prices.weekDays} days
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handlePay("single")}
                                                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl bg-[#0070BA] text-white text-sm sm:text-base font-bold hover:opacity-90 active:scale-95 transition-all"
                                                    >
                                                        {formatUsd(prices.single)} · This file only
                                                    </button>
                                                </div>
                                            )}

                                            {prices.freeCode && (
                                                <>
                                                    <div className="flex items-center gap-3 text-[11px] text-gray-400">
                                                        <span className="h-px flex-1 bg-gray-200" />
                                                        {prices.payment ? "or" : "free voucher"}
                                                        <span className="h-px flex-1 bg-gray-200" />
                                                    </div>

                                                    <DiscordRedeemSection
                                                        weekDays={prices.weekDays}
                                                        batchSize={prices.passBatchSize}
                                                        onRedeemed={() =>
                                                            onSuccess(bookKey, url)
                                                        }
                                                    />
                                                </>
                                            )}

                                            {prices.dailyFree && (
                                                <button
                                                    type="button"
                                                    onClick={onClose}
                                                    className="w-full text-[11px] sm:text-xs text-gray-500 hover:text-gray-800 underline underline-offset-2 transition-colors"
                                                >
                                                    Skip — free download resets tomorrow.
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {stage === "creating" && (
                                        <div className="flex items-center justify-center gap-2 py-6 text-gray-600">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span className="text-sm">
                                                Redirecting to secure payment...
                                            </span>
                                        </div>
                                    )}

                                    {stage === "waiting" && (
                                        <div className="text-center space-y-4">
                                            <div className="flex items-center justify-center gap-2 text-gray-700">
                                                <Loader2 className="w-5 h-5 animate-spin text-[var(--color-primary)]" />
                                                <span className="text-sm font-medium">
                                                    Waiting for payment to complete...
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 leading-relaxed">
                                                Your payment is not confirmed yet. If you
                                                already completed it on the payment page,
                                                this will unlock automatically within a few
                                                seconds. Otherwise, reopen the payment page
                                                below.
                                            </p>
                                            {order && prices.payment && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        // 重新申请一个支付链接后同标签跳转
                                                        fetch("/api/payment/create-order", {
                                                            method: "POST",
                                                            headers: { "Content-Type": "application/json" },
                                                            body: JSON.stringify({
                                                                bookKey: order.bookKey,
                                                                type: order.type,
                                                            }),
                                                        })
                                                            .then((r) => r.json())
                                                            .then((d) => {
                                                                if (d.paymentUrl) window.location.href = d.paymentUrl;
                                                            })
                                                            .catch(() =>
                                                                toast.error("Could not open the payment page."),
                                                            );
                                                    }}
                                                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)] hover:underline"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                    Reopen payment page
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {stage === "error" && (
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
                                                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                                                <p className="text-xs sm:text-sm text-red-600 leading-relaxed">
                                                    {error}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleRetry}
                                                className="w-full inline-flex items-center justify-center px-4 py-3 rounded-xl bg-[var(--color-primary)] text-white font-bold hover:opacity-90 active:scale-95 transition-all"
                                            >
                                                Try again
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
