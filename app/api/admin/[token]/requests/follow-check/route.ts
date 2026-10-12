import { NextRequest, NextResponse } from "next/server";
import { checkAdminToken } from "@/lib/discord-pass";
import { checkAuthorFollows } from "@/lib/x-followers";
import { recordFollow } from "@/lib/tweet-pass";

// 判断给定 X 作者是否为 @aivaded 的粉丝（仅展示，不参与审核判定）。
export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ token: string }> };

export async function POST(req: NextRequest, ctx: RouteCtx) {
    const { token } = await ctx.params;
    if (!checkAdminToken(token)) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let body: { screenName?: string; dbOnly?: boolean; requestId?: number };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const screenName = String(body.screenName ?? "").trim();
    if (!screenName) {
        return NextResponse.json({ error: "Missing screenName" }, { status: 400 });
    }

    try {
        const { followed } = await checkAuthorFollows(screenName, {
            supplement: !body.dbOnly,
        });
        // 传入申请行 id 时，将作者与关注结果回写数据库，使表格持久展示。
        const requestId = Number(body.requestId);
        if (Number.isInteger(requestId)) {
            await recordFollow(requestId, screenName, followed);
        }
        return NextResponse.json({ ok: true, followed });
    } catch (err) {
        console.error("follow check failed:", err);
        return NextResponse.json({ error: "check_failed" }, { status: 502 });
    }
}
