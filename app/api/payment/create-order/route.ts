import { NextRequest, NextResponse } from "next/server";
import { getAmountCents, isPaymentEnabled, type PassType } from "@/lib/payment-config";

// 服务端创建 PayPal 订单，持有 API Key（绝不暴露给前端）。
export const dynamic = "force-dynamic";

const BASE_URL = process.env.PAYMENT_BASE_URL || "https://payment.aivaded.com";
const API_KEY = process.env.PAYMENT_API_KEY;

const CURRENCY = "usd";

export async function POST(req: NextRequest) {
    // PAYMENT_ENABLE=false：支付入口已关闭，不接受下单。
    if (!isPaymentEnabled()) {
        return NextResponse.json(
            { error: "Payment is currently disabled." },
            { status: 503 },
        );
    }

    if (!API_KEY) {
        return NextResponse.json(
            { error: "Payment is not configured on this server." },
            { status: 500 },
        );
    }

    let bookKey: string;
    let type: PassType;
    try {
        const body = await req.json();
        bookKey = String(body.bookKey || "");
        const rawType = String(body.type || "single");
        if (rawType !== "single" && rawType !== "week") {
            return NextResponse.json(
                { error: "Invalid payment type." },
                { status: 400 },
            );
        }
        type = rawType;
    } catch {
        return NextResponse.json(
            { error: "Invalid request body." },
            { status: 400 },
        );
    }

    if (!bookKey) {
        return NextResponse.json(
            { error: "Missing bookKey." },
            { status: 400 },
        );
    }

    const prefix = type === "week" ? "FLIPW" : "FLIP";
    const orderNumber = `${prefix}-${bookKey}-${Date.now()}`;
    const description =
        type === "week"
            ? "Weekly unlimited PDF downloads (7 days)"
            : "PDF download unlock (single file)";
    // 支付完成后网关把新标签跳回首页；授权仍由原页面的轮询流程写入，回调页仅作落地。
    const callbackUrl = `${req.nextUrl.origin}/?payment=done`;

    try {
        const res = await fetch(`${BASE_URL}/api/v1/orders`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                order_number: orderNumber,
                amount: getAmountCents(type),
                currency: CURRENCY,
                payment_method: "paypal",
                user_id: bookKey,
                description,
                callback_url: callbackUrl,
                metadata: { bookKey, type },
            }),
        });

        const json = await res.json();

        if (!res.ok || json.code !== "SUCCESS") {
            console.error("Failed to create payment order:", json);
            return NextResponse.json(
                { error: json.message || "Failed to create payment order." },
                { status: res.status || 502 },
            );
        }

        return NextResponse.json({
            orderId: json.data.order_id,
            orderNumber: json.data.order_number,
            paymentUrl: json.data.payment_url,
            type,
        });
    } catch (error) {
        console.error("Error creating payment order:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}
