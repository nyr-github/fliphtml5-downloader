import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { books } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

// 设置此API路由为动态渲染
export const dynamic = "force-dynamic";

// Vercel Cron 配置 - 每天凌晨1点执行
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    // 验证 CRON_SECRET
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

    // 计算昨天的日期范围
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    // 设置为昨天的开始时间 (00:00:00)
    yesterday.setHours(0, 0, 0, 0);

    // 设置为昨天的结束时间 (23:59:59.999)
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    // 查询昨天新增的书本数量
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(books)
      .where(
        sql`${books.createdAt} >= ${yesterday} AND ${books.createdAt} <= ${yesterdayEnd}`,
      );

    const newBooksCount = result[0]?.count || 0;

    // 构建消息

    const message = `📊 昨日数据统计报告:\n新增书本数量: ${newBooksCount} 本\n统计时间: ${yesterday.toLocaleDateString("zh-CN")}`;

    // 发送到 Discord Webhook
    try {
      const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
      if (!webhookUrl) {
        console.error("DISCORD_WEBHOOK_URL environment variable is not set");
        return NextResponse.json(
          { error: "Server configuration error" },
          { status: 500 },
        );
      }

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
        }),
      });

      if (!response.ok) {
        console.error(
          `Webhook request failed: ${response.status} ${response.statusText}`,
        );
        return NextResponse.json(
          {
            success: false,
            error: "Failed to send webhook",
            newBooksCount,
            date: yesterday.toISOString(),
          },
          { status: 502 },
        );
      }

      console.log(
        `Successfully sent webhook: ${newBooksCount} new books on ${yesterday.toISOString()}`,
      );

      return NextResponse.json({
        success: true,
        newBooksCount,
        date: yesterday.toISOString(),
        message: "Daily statistics report sent successfully",
      });
    } catch (webhookError) {
      console.error("Error sending webhook:", webhookError);
      return NextResponse.json(
        {
          success: false,
          error: "Webhook request failed",
          newBooksCount,
          date: yesterday.toISOString(),
        },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error("Error in cron job:", error);
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
