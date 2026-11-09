import assert from "node:assert/strict";
import test from "node:test";
import { decryptPages } from "../lib/decryption";

test("concurrent decodes wait for WASM readiness, not merely exported wrappers", async (t) => {
  const pages = [{ n: ["synthetic.jpg"] }];
  const runtime = { isReady: false, _DeString: () => 2 };
  let prematureCalls = 0;
  let allocations = 0;
  let scriptCount = 0;
  let startup: ReturnType<typeof setTimeout> | undefined;
  const fakeWindow = {
    Module: runtime,
    allocateUTF8: () => {
      if (!runtime.isReady) {
        prematureCalls++;
        throw new Error("Aborted(Assertion failed: native function `malloc` called before runtime initialization)");
      }
      allocations++;
      return 1;
    },
    UTF8ToString: () => JSON.stringify(pages),
  };
  interface Script {
    src: string;
    onload?: () => void;
    remove: () => void;
  }
  const fakeDocument = {
    createElement: () => ({ src: "", remove: () => {} }),
    body: {
      appendChild: (script: Script) => {
        scriptCount++;
        // Script load completes before Emscripten's asynchronous runtime startup.
        if (script.src.endsWith("deString.js")) {
          startup = setTimeout(() => { runtime.isReady = true; }, 30);
        }
        queueMicrotask(() => script.onload?.());
      },
    },
  };
  for (const [key, value] of Object.entries({ window: fakeWindow, document: fakeDocument })) {
    const original = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { value, configurable: true });
    t.after(() => {
      if (original) Object.defineProperty(globalThis, key, original);
      else Reflect.deleteProperty(globalThis, key);
    });
  }
  t.after(() => clearTimeout(startup));

  assert.deepEqual(await Promise.all([decryptPages("first"), decryptPages("second")]), [pages, pages]);
  assert.equal(prematureCalls, 0);
  assert.equal(allocations, 2);
  assert.equal(scriptCount, 2, "Concurrent tasks should share the two script loads");
});
