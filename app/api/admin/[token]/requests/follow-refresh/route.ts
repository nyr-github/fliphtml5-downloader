import { NextRequest, NextResponse } from "next/server";
import { checkAdminToken } from "@/lib/discord-pass";
import { refreshFollowers } from "@/lib/x-followers";

// 批量审核开始时至少调用一次：整体刷新 @aivaded 粉丝列表并落库（分页直到翻完或达上限）。
export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ token: string }> };

export async function POST(_req: NextRequest, ctx: RouteCtx) {
    const { token } = await ctx.params;
    if (!checkAdminToken(token)) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    try {
        const result = await refreshFollowers();
        if (result.error) {
            return NextResponse.json({ ok: false, ...result }, { status: 502 });
        }
        return NextResponse.json({ ok: true, ...result });
    } catch (err) {
        console.error("followers refresh failed:", err);
        return NextResponse.json({ error: "refresh_failed" }, { status: 502 });
    }
}
