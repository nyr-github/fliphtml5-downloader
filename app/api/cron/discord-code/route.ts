import { NextRequest, NextResponse } from "next/server";
import { runDailyDistribution } from "@/lib/discord-pass";

// 每日 00:00 UTC（北京时间早 8 点）自动发放：保证当天（UTC）至少生成一批通行证码
// （后台若没手动生成过，则由本任务自动生成 DISCORD_PASS_BATCH_SIZE 张），
// 再把所有未发送且仍有剩余次数的码投递到 Discord。发放不再依赖后台是否手动点过。
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET environment variable is not set");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn("Unauthorized cron job attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await runDailyDistribution();
    if ("error" in result) {
      const status =
        result.error === "not_configured" ? 500 : result.error === "unavailable" ? 503 : 502;
      return NextResponse.json({ success: false, ...result }, { status });
    }
    return NextResponse.json({
      success: true,
      generated: result.generated,
      sent: result.sent,
    });
  } catch (error) {
    console.error("Error in discord-code cron job:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
