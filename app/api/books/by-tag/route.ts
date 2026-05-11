import { NextRequest, NextResponse } from "next/server";
import { getBooksByTag } from "@/lib/actions";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tag = searchParams.get("tag");
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "12");

  if (!tag) {
    return NextResponse.json(
      { error: "Tag parameter is required" },
      { status: 400 },
    );
  }

  try {
    const result = await getBooksByTag(tag, page, pageSize);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in books by-tag API:", error);
    return NextResponse.json(
      { error: "Failed to fetch books by tag" },
      { status: 500 },
    );
  }
}
