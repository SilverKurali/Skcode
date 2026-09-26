import assert from "node:assert/strict";
import test from "node:test";
import {
  DIZZY_ACTION,
  IDLE_ACTIONS,
  PET_ACTIONS,
  PET_CLICK_WINDOW_MS,
  PET_DIZZY_CLICK_COUNT,
  pickAction,
  resolvePetReaction,
} from "../src/pet/petActions.js";

test("pickAction returns a member of the pool and respects the rng", () => {
  for (let i = 0; i < 50; i += 1) {
    assert.ok(IDLE_ACTIONS.includes(pickAction(IDLE_ACTIONS)));
    assert.ok(PET_ACTIONS.includes(pickAction(PET_ACTIONS)));
  }
  assert.equal(
    pickAction(IDLE_ACTIONS, () => 0),
    IDLE_ACTIONS[0],
  );
  assert.equal(
    pickAction(IDLE_ACTIONS, () => 0.999),
    IDLE_ACTIONS[IDLE_ACTIONS.length - 1],
  );
});

test("sparse clicks stay on the normal pet reaction", () => {
  const now = 10_000;
  const clicks = [0, 3000, 6000, 9000].map((offset) => now - offset);
  const reaction = resolvePetReaction(clicks, now);
  assert.equal(reaction.dizzy, false);
  assert.ok(reaction.recentClickCount < PET_DIZZY_CLICK_COUNT);
});

test("rapid clicks within the window trigger the dizzy reaction", () => {
  const now = 10_000;
  const clicks = Array.from({ length: PET_DIZZY_CLICK_COUNT }, (_, i) => now - i * 100);
  assert.equal(resolvePetReaction(clicks, now).dizzy, true);
});

test("clicks older than the window no longer count toward dizzy", () => {
  const now = 10_000;
  const stale = Array.from({ length: PET_DIZZY_CLICK_COUNT }, () => now - PET_CLICK_WINDOW_MS - 1);
  assert.equal(resolvePetReaction(stale, now).dizzy, false);
  // 补一次新鲜点击后，窗口内只有 1 次，仍不晕。
  assert.equal(resolvePetReaction([...stale, now], now).dizzy, false);
});

test("future timestamps are ignored", () => {
  const now = 10_000;
  const clicks = Array.from({ length: PET_DIZZY_CLICK_COUNT + 3 }, () => now + 5000);
  assert.equal(resolvePetReaction(clicks, now).dizzy, false);
});

test("dizzy action is distinct from every normal pet action", () => {
  for (const action of PET_ACTIONS) {
    assert.notEqual(action.id, DIZZY_ACTION.id);
    assert.notEqual(action.className, DIZZY_ACTION.className);
  }
});
