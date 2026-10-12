import { NextRequest, NextResponse } from "next/server";
import { checkAdminToken } from "@/lib/discord-pass";
import {
    listTweetRequests,
    approveTweetRequest,
    rejectTweetRequest,
} from "@/lib/tweet-pass";

// /admin/[ADMIN_TOKEN] 体系的后台接口：Twitter 换券申请列表 / 通过 / 拒绝。
export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ token: string }> };

async function unauthorized(ctx: RouteCtx): Promise<boolean> {
    const { token } = await ctx.params;
    return !checkAdminToken(token);
}

const forbidden = () =>
    NextResponse.json({ error: "Not found" }, { status: 404 });

export async function GET(_req: NextRequest, ctx: RouteCtx) {
    if (await unauthorized(ctx)) return forbidden();
    try {
        const requests = await listTweetRequests(200);
        return NextResponse.json({ requests });
    } catch (err) {
        console.error("admin tweet requests list failed:", err);
        return NextResponse.json(
            { error: "Database unavailable" },
            { status: 503 },
        );
    }
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
    if (await unauthorized(ctx)) return forbidden();

    let body: { action?: string; id?: number };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const id = Number(body.id);
    if (!Number.isInteger(id)) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    try {
        if (body.action === "approve") {
            const result = await approveTweetRequest(id);
            if ("error" in result) {
                return NextResponse.json({ ok: false, ...result }, { status: 400 });
            }
            return NextResponse.json({ ok: true, code: result.code });
        }
        if (body.action === "reject") {
            const result = await rejectTweetRequest(id);
            if ("error" in result) {
                return NextResponse.json({ ok: false, ...result }, { status: 400 });
            }
            return NextResponse.json({ ok: true });
        }
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    } catch (err) {
        console.error("admin tweet request action failed:", err);
        return NextResponse.json(
            { error: "Database unavailable" },
            { status: 503 },
        );
    }
}
