import assert from "node:assert/strict";
import test from "node:test";
import { derivePetMood } from "../src/pet/petMood.js";

test("permission interaction outranks running phase and error", () => {
  assert.equal(
    derivePetMood({ phase: "running", pendingKinds: ["permission"], hasError: false }),
    "permission",
  );
  assert.equal(
    derivePetMood({ phase: "error", pendingKinds: ["permission"], hasError: true }),
    "permission",
  );
});

test("userInput interaction outranks error and working", () => {
  assert.equal(
    derivePetMood({ phase: "running", pendingKinds: ["userInput"], hasError: false }),
    "question",
  );
  assert.equal(
    derivePetMood({ phase: "error", pendingKinds: ["userInput"], hasError: true }),
    "question",
  );
});

test("error beats working; working beats done", () => {
  assert.equal(derivePetMood({ phase: "running", pendingKinds: [], hasError: true }), "error");
  assert.equal(
    derivePetMood({ phase: "completedSuccess", pendingKinds: [], hasError: true }),
    "error",
  );
  assert.equal(derivePetMood({ phase: "running", pendingKinds: [], hasError: false }), "working");
  assert.equal(
    derivePetMood({ phase: "prewarming", pendingKinds: [], hasError: false }),
    "working",
  );
});

test("completedSuccess maps to done; other phases fall back to idle", () => {
  assert.equal(
    derivePetMood({ phase: "completedSuccess", pendingKinds: [], hasError: false }),
    "done",
  );
  assert.equal(
    derivePetMood({ phase: "completedInterrupted", pendingKinds: [], hasError: false }),
    "idle",
  );
  assert.equal(derivePetMood({ phase: "draft", pendingKinds: [], hasError: false }), "idle");
  assert.equal(derivePetMood({ phase: null, pendingKinds: [], hasError: false }), "idle");
});

test("workspaceHookReview does not change the mood", () => {
  assert.equal(
    derivePetMood({
      phase: "running",
      pendingKinds: ["workspaceHookReview"],
      hasError: false,
    }),
    "working",
  );
});
