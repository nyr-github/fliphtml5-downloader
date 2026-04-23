import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Clean URL by removing ./ and \ characters, and leading /
 * @param url - The URL string to clean
 * @returns Cleaned URL string
 */
export function cleanUrl(url: string): string {
  return url.replace(/^\/+/, "").replace(/\.\//g, "").replace(/\\/g, "");
}

/**
 * Build thumbnail URL for FlipHTML5 books
 * @param thumbnail - Thumbnail path or URL
 * @param id1 - First ID part of the book
 * @param id2 - Second ID part of the book
 * @returns Full thumbnail URL
 */
export function buildThumbnailUrl(
  thumbnail: string,
  id1: string,
  id2: string
): string {
  if (thumbnail.startsWith("http")) {
    return thumbnail;
  }
  return `https://online.fliphtml5.com/${id1}/${id2}/${cleanUrl(thumbnail)}`;
}
