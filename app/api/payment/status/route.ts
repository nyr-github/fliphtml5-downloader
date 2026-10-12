import { NextRequest, NextResponse } from "next/server";

// 前端轮询订单状态：服务端带密钥代理网关查询，pending 时触发一次向 PayPal 核验。
export const dynamic = "force-dynamic";

const BASE_URL = process.env.PAYMENT_BASE_URL || "https://payment.aivaded.com";
const API_KEY = process.env.PAYMENT_API_KEY;

async function queryByNumber(orderNumber: string) {
    const res = await fetch(
        `${BASE_URL}/api/v1/orders/by-number/${encodeURIComponent(orderNumber)}`,
        { headers: { Authorization: `Bearer ${API_KEY}` } },
    );
    const json = await res.json();
    return { ok: res.ok, json };
}

export async function GET(req: NextRequest) {
    if (!API_KEY) {
        return NextResponse.json(
            { error: "Payment is not configured on this server." },
            { status: 500 },
        );
    }

    const orderNumber = req.nextUrl.searchParams.get("order_number");
    const orderId = req.nextUrl.searchParams.get("order_id");

    if (!orderNumber) {
        return NextResponse.json(
            { error: "Missing order_number." },
            { status: 400 },
        );
    }

    try {
        let { ok, json } = await queryByNumber(orderNumber);
        let data = json?.data;

        // 仍为 pending 且有 order_id 时，触发网关向 PayPal 核验一次后重查（回调兜底）
        if (ok && data?.status === "pending" && orderId) {
            await fetch(
                `${BASE_URL}/api/v1/orders/${encodeURIComponent(orderId)}/verify-payment`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${API_KEY}`,
                        "Content-Type": "application/json",
                    },
                },
            );
            const recheck = await queryByNumber(orderNumber);
            ok = recheck.ok;
            json = recheck.json;
            data = json?.data;
        }

        if (!ok || json.code !== "SUCCESS") {
            return NextResponse.json(
                { error: json.message || "Failed to query order." },
                { status: 502 },
            );
        }

        return NextResponse.json({
            status: data.status,
            amount: data.amount,
            paidAt: data.paid_at,
        });
    } catch (error) {
        console.error("Error querying payment status:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}
