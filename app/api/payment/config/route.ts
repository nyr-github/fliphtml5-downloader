import { NextResponse } from "next/server";
import { getPublicPrices } from "@/lib/payment-config";

// 前端读取当前生效价格与 PAY_DEBUG 标记，避免价格文案与服务端漂移。
export const dynamic = "force-dynamic";

export async function GET() {
    return NextResponse.json(getPublicPrices());
}
