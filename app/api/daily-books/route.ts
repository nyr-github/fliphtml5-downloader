import { NextRequest, NextResponse } from "next/server";
import { getAvailableDates, getBooksByDate } from "@/lib/actions/daily-books";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get("action");
  const date = searchParams.get("date");

  try {
    if (action === "dates") {
      // 获取所有可用日期
      const result = await getAvailableDates();
      return NextResponse.json(result);
    } else if (date) {
      // 获取指定日期的书籍
      const result = await getBooksByDate(date);
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: "Missing date or action parameter" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in daily books API:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily books" },
      { status: 500 }
    );
  }
}