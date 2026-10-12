import { NextRequest, NextResponse } from "next/server";
import {
  checkAdminToken,
  generatePassCodes,
  listPassCodes,
  generateAndSendPassCodes,
  passBatchDefault,
  passBatchMax,
  passConfig,
} from "@/lib/discord-pass";

// /admin/[ADMIN_TOKEN] 体系的后台接口：通行证码批量生成 / 列表 / 发送 Discord。
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
    const codes = await listPassCodes(200);
    return NextResponse.json({ codes, config: passConfig() });
  } catch (err) {
    console.error("admin passes list failed:", err);
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  if (await unauthorized(ctx)) return forbidden();

  let body: { action?: string; count?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    if (body.action === "generate") {
      // 上限仅约束后台手动生成（每日定时发放不受此限制）
      const count = Math.min(
        Number(body.count) || passBatchDefault(),
        passBatchMax(),
      );
      const codes = await generatePassCodes(count);
      return NextResponse.json({ ok: true, codes });
    }
    if (body.action === "send") {
      // 发送到 Discord：现场生成 count 张新码并投递（与生成上限一致）
      const count = Math.min(
        Number(body.count) || passBatchDefault(),
        passBatchMax(),
      );
      const result = await generateAndSendPassCodes(count);
      if ("error" in result) {
        return NextResponse.json({ ok: false, ...result }, { status: 502 });
      }
      return NextResponse.json({ ok: true, generated: count, sent: result.sent });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("admin passes action failed:", err);
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
