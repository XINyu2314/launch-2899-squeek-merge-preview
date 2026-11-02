import test from "node:test";
import assert from "node:assert/strict";
import { listSnapshots, saveSnapshot, snapshotRows } from "../../src/snapshots.ts";
import { buildRows } from "../../src/rules.ts";

const store = new Map();
globalThis.localStorage = {
  getItem: key => store.get(key) ?? null,
  setItem: (key, value) => store.set(key, value),
};
const survivor = { tokenId: "8001", nameZh: "Squeek #8001", nameEn: "Squeek #8001", level: 1, status: "idle", mergeable: true };
const donor = { ...survivor, tokenId: "8002" };
const baseline = () => ({ owner: "review-wallet", source: "api", holdings: [survivor, donor], survivor, donor, pace: "steady" });

test("saved conclusions, pair and holdings survive a changed rule table and absent current holdings", () => {
  store.clear();
  const rules = { maximumLevel: 10, basePower: [1000, 2200], cooldownBlocks: [0, 3000] };
  const comparison = buildRows(survivor, donor, "steady", rules);
  saveSnapshot({ ...baseline(), comparison });
  rules.basePower[1] = 9000;
  comparison[3].d7.v.p = "mutated";
  const reopened = listSnapshots("review-wallet")[0];
  assert.equal(snapshotRows(reopened)[3].d7.v.p, "2,200");
  assert.equal(snapshotRows(reopened)[3].d30.v.p, "2,200");
  assert.equal(reopened.donor.tokenId, "8002");
  assert.equal(reopened.holdings.length, 2);
  assert.equal(reopened.chainId, 11155111);
  assert.match(reopened.createdAtUtc, /Z$/);
  assert.equal(listSnapshots("other-wallet").length, 0);
});

test("legacy snapshots keep saved token facts and explicitly mark missing historical parameters Unknown", () => {
  const rows = snapshotRows(baseline());
  assert.equal(rows.find(r => r.item === "r_lost").d7.v.id, "8002");
  for (const item of ["r_power", "r_cooldown", "r_remerge"]) {
    const row = rows.find(r => r.item === item);
    assert.equal(row.tag, "unknown");
    assert.equal(row.d7.k, "v_ruleUnsaved");
    assert.equal(row.d30.k, "v_ruleUnsaved");
  }
});

test("snapshots from another chain are excluded", () => {
  store.set("smp:snapshots:wrong-chain", JSON.stringify([{ ...baseline(), chainId: 1 }]));
  assert.deepEqual(listSnapshots("wrong-chain"), []);
});
