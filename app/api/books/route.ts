import { NextRequest, NextResponse } from "next/server";
import { getBooksPaginated } from "@/lib/actions";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "12");

  try {
    const result = await getBooksPaginated(page, pageSize);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in books API:", error);
    return NextResponse.json(
      { error: "Failed to fetch books" },
      { status: 500 },
    );
  }
}
