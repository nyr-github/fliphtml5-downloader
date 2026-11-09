import assert from "node:assert/strict";
import test from "node:test";
import { MAX_SAVED_TASKS, pdfFilename, restoreTasks, serializeTasks, type DownloadTask } from "../lib/tasks";

const task: DownloadTask = {
  id: "one", title: "Example", url: "https://fliphtml5.com/author/publication/",
  status: "done", progress: 100, currentPage: 2, totalPages: 2, pdfBlobUrl: "blob:expired",
};

test("stores metadata only and restores finished/interrupted jobs as restartable", () => {
  const saved = serializeTasks([task]);
  assert.ok(!saved.includes("blob:"));
  const [restored] = restoreTasks(saved);
  assert.equal(restored.status, "idle");
  assert.equal(restored.progress, 0);
  assert.equal(restored.pdfBlobUrl, undefined);
  assert.equal(restored.url, task.url);
  assert.equal(restoreTasks(serializeTasks([{ ...task, status: "processing" }]))[0].status, "idle");
});

test("preserves failures but rejects malformed or duplicate stored jobs", () => {
  assert.equal(restoreTasks(serializeTasks([{ ...task, status: "error", errorMessage: "Failed" }]))[0].errorMessage, "Failed");
  for (const raw of [null, "broken", "{}", "[null]", '[{"id":"x"}]']) assert.deepEqual(restoreTasks(raw), []);
  assert.equal(restoreTasks(JSON.stringify([task, task, { ...task, id: "two", url: "https://evil.test/a/b" }])).length, 1);
});

test("bounds history and sanitizes PDF filenames", () => {
  const tasks = Array.from({ length: 20 }, (_, index) => ({ ...task, id: `${index}` }));
  assert.equal(restoreTasks(serializeTasks(tasks)).length, MAX_SAVED_TASKS);
  assert.equal(pdfFilename('a/b:c?d\u0000'), "a_b_c_d_.pdf");
  assert.equal(pdfFilename("..."), "publication.pdf");
});
