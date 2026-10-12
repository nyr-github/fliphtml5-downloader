import { NextRequest, NextResponse } from "next/server";
import { checkAdminToken } from "@/lib/discord-pass";

// /admin/[ADMIN_TOKEN] 体系：后台校验 X 帖子是否可访问（经 twitter-api45 RapidAPI 代理，密钥不下发到浏览器）。
export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ token: string }> };

const RAPIDAPI_HOST = "twitter-api45.p.rapidapi.com";

export async function POST(req: NextRequest, ctx: RouteCtx) {
    const { token } = await ctx.params;
    if (!checkAdminToken(token)) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let body: { id?: string | number };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const id = String(body.id ?? "").trim();
    if (!/^\d+$/.test(id)) {
        return NextResponse.json({ error: "Invalid tweet id" }, { status: 400 });
    }

    const key = process.env.RAPIDAPI_TWITTER_KEY;
    if (!key) {
        return NextResponse.json(
            { error: "RapidAPI key not configured" },
            { status: 500 },
        );
    }

    try {
        const res = await fetch(`https://${RAPIDAPI_HOST}/tweet.php?id=${id}`, {
            headers: {
                "x-rapidapi-host": RAPIDAPI_HOST,
                "x-rapidapi-key": key,
            },
            cache: "no-store",
        });
        if (!res.ok) {
            return NextResponse.json(
                { error: `Upstream ${res.status}` },
                { status: 502 },
            );
        }
        const data = (await res.json()) as Record<string, unknown>;
        const author =
            (data?.author as Record<string, unknown> | undefined)?.screen_name ?? null;
        return NextResponse.json({ ok: true, data, author });
    } catch (err) {
        console.error("check tweet failed:", err);
        return NextResponse.json(
            { error: "Check request failed" },
            { status: 502 },
        );
    }
}
