/**
 * Storage key for pending download URL
 * Used to pass URL from book pages to homepage without triggering SSR
 */
const PENDING_DOWNLOAD_KEY = "flipbook_pending_download_url";

/**
 * Store URL for download when navigating back to homepage
 * Call this before navigating to /
 * @param url - The flipbook URL to download
 */
export function setPendingDownloadUrl(url: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PENDING_DOWNLOAD_KEY, url);
  } catch (error) {
    console.error("Failed to store pending download URL:", error);
  }
}

/**
 * Get and clear pending download URL
 * Call this on homepage mount to retrieve the URL
 * @returns The stored URL or null, and clears it immediately
 */
export function getAndClearPendingDownloadUrl(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const url = localStorage.getItem(PENDING_DOWNLOAD_KEY);
    if (url) {
      localStorage.removeItem(PENDING_DOWNLOAD_KEY);
    }
    return url;
  } catch (error) {
    console.error("Failed to retrieve pending download URL:", error);
    return null;
  }
}

/**
 * Check if there's a pending download URL (without clearing)
 * @returns true if there's a pending URL
 */
export function hasPendingDownloadUrl(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(PENDING_DOWNLOAD_KEY) !== null;
  } catch (error) {
    return false;
  }
}
