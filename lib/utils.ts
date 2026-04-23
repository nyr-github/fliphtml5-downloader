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
