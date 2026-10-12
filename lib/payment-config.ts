// 支付定价：正常价 + PAY_DEBUG 调试价。
// 服务端 create-order / config 路由共享，避免两处硬编码漂移。

import { passConfig } from "@/lib/discord-pass";

export type PassType = "single" | "week";

const NORMAL_CENTS: Record<PassType, number> = {
    single: 100, // $1.00 单本解锁
    week: 500, // $5.00 7 天无限
};

// PAY_DEBUG=true 时两个价格均降为 $0.10（10 分）用于支付链路自测。
const DEBUG_CENTS = 10;

export function isPayDebug(): boolean {
    return process.env.PAY_DEBUG === "true";
}

// FREE_ONCE_EVERYDAY=false 时取消「每天首次下载免费」额度（每个文件都要解锁）；
// 未设置或其他值均视为开启，保持默认产品策略。
export function isDailyFreeEnabled(): boolean {
    return process.env.FREE_ONCE_EVERYDAY !== "false";
}

// FREE_CODE_ENABLE=false 时前端不再展示免费券兑换入口（Discord / X 码）；
// 只隐藏 UI，/api/discord/redeem 接口本身仍然可用。
export function isFreeCodeEnabled(): boolean {
    return process.env.FREE_CODE_ENABLE !== "false";
}

// PAYMENT_ENABLE=false 时关闭支付入口：弹窗不再展示付费按钮，create-order 拒绝下单；
// 若同时 FREE_CODE_ENABLE 开启，则表示暂时只支持通过 Discord / X 获取免费券解锁。
export function isPaymentEnabled(): boolean {
    return process.env.PAYMENT_ENABLE !== "false";
}

export function getAmountCents(type: PassType): number {
    return isPayDebug() ? DEBUG_CENTS : NORMAL_CENTS[type];
}

export function formatUsdLabel(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
}

export function getPublicPrices() {
    return {
        single: getAmountCents("single"),
        week: getAmountCents("week"),
        debug: isPayDebug(),
        dailyFree: isDailyFreeEnabled(),
        freeCode: isFreeCodeEnabled(),
        payment: isPaymentEnabled(),
        // Discord/X 免费券运营参数（周卡天数、每码可用次数、每日发放量），供前端文案与激活天数使用，
        // 与兑换服务端同源，避免弹窗显示的天数/次数与实际配置漂移。
        ...passConfig(),
    };
}
