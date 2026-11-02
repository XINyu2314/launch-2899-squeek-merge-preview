import test from "node:test";
import assert from "node:assert/strict";
import { blockReason, buildRows, canOpenOfficial, isLegalPair } from "../../src/rules.ts";

const rules = { maximumLevel: 10, basePower: [1000, 2200, 4840], cooldownBlocks: [0, 3000, 7000] };
const sq = (id, status = "idle", level = 1, mergeable = true) => ({ tokenId: id, nameZh: id, nameEn: id, status, level, mergeable });

test("staked and cooling Squeeks are blocked with a reason", () => {
  assert.equal(blockReason(sq("1002", "staked", 1, false), null, rules), "reason_staked");
  assert.equal(blockReason(sq("1004", "cooling", 1, false), null, rules), "reason_cooling");
  assert.equal(blockReason(sq("1010", "claimable"), null, rules), null);
});
test("levels must match and max level is refused", () => {
  assert.equal(blockReason(sq("2", "idle", 2), sq("1"), rules), "reason_level");
  assert.equal(blockReason(sq("3", "idle", 10), null, rules), "reason_max");
  assert.ok(isLegalPair(sq("1001"), sq("1003"), rules));
  assert.ok(!isLegalPair(sq("1001"), sq("1001"), rules));
});
test("every row carries one of the three tags, deterministic output", () => {
  const a = buildRows(sq("1001"), sq("1003"), "steady", rules);
  const b = buildRows(sq("1001"), sq("1003"), "steady", rules);
  assert.deepEqual(a, b);
  for (const r of a) assert.ok(["certain", "scenario", "unknown"].includes(r.tag));
  assert.equal(a.find((r) => r.item === "r_power").d7.v.p, "2,200");
  assert.equal(a.find((r) => r.item === "r_earn").tag, "unknown");
});
test("official checklist needs the irreversibility gate", () => {
  assert.equal(canOpenOfficial({ g_lost: true, g_noUndo: true }), false);
  assert.equal(canOpenOfficial({ g_gate: true }), true);
});
