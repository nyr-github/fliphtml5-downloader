import { NextRequest, NextResponse } from "next/server";
import { submitTweetRequest } from "@/lib/tweet-pass";

// 公开接口：提交「X 帖子链接 + 正文 + 接收邮箱」申请免费券，进入后台待审核队列。
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    // 蜜罐：正常用户不会填 website 字段，填了直接静默成功（不入库），骗过自动化脚本。
    if (String(body.website || "").trim()) {
        return NextResponse.json({ ok: true });
    }

    const result = await submitTweetRequest({
        tweetUrl: String(body.tweetUrl || ""),
        email: String(body.email || ""),
        tweetText: String(body.tweetText || ""),
    });

    if ("error" in result) {
        const status = result.error === "unavailable" ? 503 : 400;
        return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({ ok: true, id: result.id });
}
