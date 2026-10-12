import { NextRequest, NextResponse } from "next/server";
import { redeemPassCode } from "@/lib/discord-pass";

// Discord 社区码兑换：每次调用都读线上库并原子扣减 1 次可用次数（每张码限 5 次）。
// 客户端拿到 ok 后自行写入 7 天周卡（授权本就存浏览器，服务端只管次数）。
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let code = "";
  try {
    const body = await req.json();
    code = String(body.code || "");
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (!code.trim()) {
    return NextResponse.json({ error: "invalid_code" }, { status: 400 });
  }

  const { status, remaining } = await redeemPassCode(code);
  switch (status) {
    case "ok":
      return NextResponse.json({ ok: true, remaining });
    case "used":
      return NextResponse.json(
        { error: "code_used_up", remaining: 0 },
        { status: 409 },
      );
    case "invalid":
      return NextResponse.json({ error: "invalid_code" }, { status: 400 });
    default:
      return NextResponse.json({ error: "not_available" }, { status: 503 });
  }
}
