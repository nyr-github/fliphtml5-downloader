import { extractIdsFromUrl } from "./book-config";

export const TASKS_STORAGE_KEY = "fliphtml5-local-tasks-v1";
export const MAX_SAVED_TASKS = 10;

export interface DownloadTask {
  id: string;
  url: string;
  status: "idle" | "loading" | "processing" | "done" | "error";
  progress: number;
  currentPage: number;
  totalPages: number;
  title: string;
  errorMessage?: string;
  pdfBlobUrl?: string;
}

export function serializeTasks(tasks: DownloadTask[]): string {
  return JSON.stringify(tasks.slice(0, MAX_SAVED_TASKS).map((task) => ({
    id: task.id, url: task.url, title: task.title,
    status: task.status, errorMessage: task.errorMessage,
  })));
}

export function restoreTasks(raw: string | null): DownloadTask[] {
  try {
    const value: unknown = JSON.parse(raw || "[]");
    if (!Array.isArray(value)) return [];
    const seen = new Set<string>();
    return value.slice(0, MAX_SAVED_TASKS).flatMap((task) => {
      if (!task || typeof task.id !== "string" || !task.id || seen.has(task.id) ||
          typeof task.url !== "string" || !extractIdsFromUrl(task.url) ||
          typeof task.title !== "string") return [];
      seen.add(task.id);
      return [{
        id: task.id, url: task.url, title: task.title,
        // Blob URLs/PDF data cannot survive a refresh. Never show a stale download.
        status: task.status === "error" ? "error" as const : "idle" as const,
        errorMessage: typeof task.errorMessage === "string" ? task.errorMessage : undefined,
        progress: 0, currentPage: 0, totalPages: 0,
      }];
    });
  } catch {
    return [];
  }
}

export function pdfFilename(title: string): string {
  const safe = Array.from(title).map((char) =>
    char.charCodeAt(0) < 32 || '<>:"/\\|?*'.includes(char) ? "_" : char,
  ).join("").trim().replace(/^[. ]+|[. ]+$/g, "").slice(0, 180);
  return `${safe || "publication"}.pdf`;
}
