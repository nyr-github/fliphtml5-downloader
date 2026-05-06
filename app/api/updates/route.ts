import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { books } from "@/lib/db/schema";
import { gte, lte, desc, and } from "drizzle-orm";

interface UpdateRecord {
  id: string;
  title: string;
  description: string | null;
  createdAt: Date;
  route: string;
}

interface UpdatesResponse {
  date: string;
  count: number;
  updates: UpdateRecord[];
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get("date");

    if (!dateParam) {
      return NextResponse.json(
        { error: "Date parameter is required (YYYY-MM-DD format)" },
        { status: 400 },
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateParam)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 },
      );
    }

    const targetDate = new Date(dateParam);
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date value" },
        { status: 400 },
      );
    }

    // Calculate date range (00:00:00 to 23:59:59)
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Query books added on the specified date
    const records = await db
      .select()
      .from(books)
      .where(
        and(gte(books.createdAt, startOfDay), lte(books.createdAt, endOfDay)),
      )
      .orderBy(desc(books.createdAt));

    // Transform response
    const updates: UpdateRecord[] = records.map((record) => ({
      id: record.id,
      title: record.title,
      description: record.description,
      createdAt: record.createdAt,
      route: `/book/${record.id}`,
    }));

    const response: UpdatesResponse = {
      date: dateParam,
      count: updates.length,
      updates,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching updates:", error);
    return NextResponse.json(
      { error: "Failed to fetch updates" },
      { status: 500 },
    );
  }
}
