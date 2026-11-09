"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { extractIdsFromUrl } from "@/lib/book-config";
import { convertPublication } from "@/lib/converter";
import { restoreTasks, serializeTasks, TASKS_STORAGE_KEY, type DownloadTask } from "@/lib/tasks";
import UrlInput from "./UrlInput";
import TaskList from "./TaskList";

export default function FlipDownloaderClient() {
  const [urlInput, setUrlInput] = useState("");
  const [tasks, setTasks] = useState<DownloadTask[]>([]);
  const [ready, setReady] = useState(false);
  const controllers = useRef(new Map<string, AbortController>());
  const blobs = useRef(new Map<string, string>());

  useEffect(() => {
    try { setTasks(restoreTasks(localStorage.getItem(TASKS_STORAGE_KEY))); }
    catch { /* Storage may be disabled; conversion still works in memory. */ }
    setReady(true);
    const activeControllers = controllers.current;
    const activeBlobs = blobs.current;
    return () => {
      activeControllers.forEach((controller) => controller.abort());
      activeBlobs.forEach((url) => URL.revokeObjectURL(url));
      activeControllers.clear();
      activeBlobs.clear();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(TASKS_STORAGE_KEY, serializeTasks(tasks)); }
    catch { /* Storage quota/private mode must not break conversion. */ }
  }, [tasks, ready]);

  const updateTask = useCallback((id: string, update: Partial<DownloadTask>) => {
    setTasks((previous) => previous.map((task) => task.id === id ? { ...task, ...update } : task));
  }, []);

  const removeTask = useCallback((id: string) => {
    controllers.current.get(id)?.abort();
    const blob = blobs.current.get(id);
    if (blob) URL.revokeObjectURL(blob);
    blobs.current.delete(id);
    setTasks((previous) => previous.filter((task) => task.id !== id));
  }, []);

  const startDownload = useCallback(async (input: string, existingId?: string) => {
    const url = input.trim();
    const ids = extractIdsFromUrl(url);
    if (!ids) {
      toast.error("Enter a valid FlipHTML5 publication URL.");
      return;
    }
    const id = existingId || crypto.randomUUID();
    if (controllers.current.has(id)) return;
    const controller = new AbortController();
    controllers.current.set(id, controller);
    const oldBlob = blobs.current.get(id);
    if (oldBlob) URL.revokeObjectURL(oldBlob);
    blobs.current.delete(id);
    const initial: DownloadTask = {
      id, url, title: ids.id2, status: "loading", progress: 0,
      currentPage: 0, totalPages: 0, errorMessage: undefined, pdfBlobUrl: undefined,
    };
    if (existingId) updateTask(id, initial);
    else setTasks((previous) => [initial, ...previous]);
    setUrlInput("");

    try {
      const result = await convertPublication(ids.id1, ids.id2, controller.signal, (progress) => {
        if (!controller.signal.aborted) updateTask(id, { ...progress, status: "processing" });
      });
      controller.signal.throwIfAborted();
      const pdfBlobUrl = URL.createObjectURL(result.blob);
      blobs.current.set(id, pdfBlobUrl);
      updateTask(id, { status: "done", progress: 100, title: result.title, pdfBlobUrl });
    } catch (error) {
      updateTask(id, controller.signal.aborted ? { status: "idle", progress: 0, currentPage: 0 } : {
        status: "error", errorMessage: error instanceof Error ? error.message : "Conversion failed.",
      });
    } finally {
      controllers.current.delete(id);
    }
  }, [updateTask]);

  if (!ready) return <p role="status" className="text-center">Loading local tasks...</p>;

  return (
    <div className="space-y-6">
      <UrlInput value={urlInput} onChange={setUrlInput} onSubmit={() => void startDownload(urlInput)} />
      <p className="text-center text-xs text-[var(--color-text-secondary)]">
        The source must allow cross-origin browser access. Private or password-protected publications are not supported.
        Only task metadata is saved in this browser, not generated PDFs.
      </p>
      {tasks.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--color-text-secondary)]">
          <h2 className="font-semibold">Local tasks</h2>
          <button type="button" onClick={() => tasks.forEach((task) => removeTask(task.id))} className="underline">
            Clear tasks
          </button>
        </div>
      )}
      <TaskList tasks={tasks} onRemove={removeTask} onStartDownload={startDownload}
        onCancel={(id) => controllers.current.get(id)?.abort()} />
    </div>
  );
}
