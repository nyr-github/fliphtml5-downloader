import { NextRequest, NextResponse } from "next/server";
import { analyzeAndTagUntaggedBooks } from "@/lib/actions/tag-analysis";

// 配置API路由为动态路由,避免静态生成
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // 验证CRON_SECRET,确保只有定时任务可以调用
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret) {
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        console.warn("Unauthorized cron job attempt");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    console.log("🕐 Book tag analysis cron job triggered");

    // 执行标签分析(Cron任务限制50本,避免超时)
    const result = await analyzeAndTagUntaggedBooks({ limit: 50 });

    return NextResponse.json({
      success: true,
      message: "Book tag analysis completed",
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Book tag analysis cron job failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Book tag analysis failed",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
