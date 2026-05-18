import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Pages that use searchParams and need cache poisoning protection
 * Only whitelisted params are allowed, others will be stripped
 */
const PROTECTED_PATHS: Record<string, string[]> = {
  "/": ["page"], // Homepage
  "/book": [], // Book detail page - no searchParams needed
  "/read": [], // Reader page - no searchParams needed
  "/books": ["tag", "page"], // Books listing
  "/blog": ["page"], // Blog listing
};

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Check if this path needs protection
  if (searchParams.size === 0) {
    return NextResponse.next();
  }

  // Find matching protected path
  let allowedParams: string[] | undefined;
  for (const [path, params] of Object.entries(PROTECTED_PATHS)) {
    if (pathname === path || pathname.startsWith(path + "/")) {
      allowedParams = params;
      break;
    }
  }

  // If not a protected path, allow it
  if (allowedParams === undefined) {
    return NextResponse.next();
  }

  // Check for unknown params
  const currentParams = Array.from(searchParams.keys());
  const hasUnknownParams = currentParams.some(
    (param) => !allowedParams.includes(param),
  );

  if (hasUnknownParams) {
    // Build clean URL with only whitelisted params
    const cleanUrl = new URL(pathname, request.url);

    // Only copy allowed params
    allowedParams.forEach((param) => {
      const value = searchParams.get(param);
      if (value) {
        cleanUrl.searchParams.set(param, value);
      }
    });

    // Redirect to clean URL (307 = temporary redirect, preserves method)
    return NextResponse.redirect(cleanUrl, 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/book/:path*",
    "/read/:path*",
    "/books/:path*",
    "/blog/:path*",
  ],
};
