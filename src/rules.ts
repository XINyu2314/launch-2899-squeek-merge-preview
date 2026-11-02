/** Merge rules and the Day 0 / +7d / +30d comparison. Pure functions: no I/O, no randomness. */
import type { Squeek } from "./data.ts";
import type { Key } from "./i18n.ts";

export type Tag = "certain" | "scenario" | "unknown";
export type Pace = "slow" | "steady" | "fast";
export type Rules = { maximumLevel: number; basePower: number[]; cooldownBlocks: number[] };

/** Squeek blocks per day for each scenario. A user-picked assumption, never a forecast. */
export const PACE: Record<Pace, [number, number]> = { slow: [300, 700], steady: [700, 1300], fast: [1300, 2000] };

export type Reason = "reason_staked" | "reason_cooling" | "reason_level" | "reason_max" | "reason_source";

/** Why a Squeek cannot join the current pick, or null when it can. Official rule: same level, below max, past cooldown, owned (not staked). */
export function blockReason(s: Squeek, survivor: Squeek | null, rules: Rules): Reason | null {
  if (s.status === "staked") return "reason_staked";
  if (s.status === "cooling") return "reason_cooling";
  if (!s.mergeable) return "reason_source";
  if (s.level !== null && s.level >= rules.maximumLevel) return "reason_max";
  if (survivor && survivor.tokenId !== s.tokenId) {
    if (s.level === null || survivor.level === null || s.level !== survivor.level) return "reason_level";
  }
  return null;
}

export function isLegalPair(a: Squeek, b: Squeek, rules: Rules): boolean {
  return a.tokenId !== b.tokenId && blockReason(a, null, rules) === null && blockReason(b, a, rules) === null;
}

/** One table cell: a dictionary key plus its variables, so snapshots re-render in either language. */
export type Cell = { k: Key; v?: Record<string, string | number> };
export type CompareRow = { item: Key; d0: Cell; d7: Cell; d30: Cell; tag: Tag; basis: Key };

const fmt = (n: number) => n.toLocaleString("en-US");

export function buildRows(survivor: Squeek, donor: Squeek, pace: Pace, rules: Rules): CompareRow[] {
  const L = survivor.level ?? 1;
  const next = L + 1;
  const p = rules.basePower[L - 1] ?? 0;
  const pNext = rules.basePower[next - 1] ?? 0;
  const cd = rules.cooldownBlocks[next - 1] ?? 0;
  const [lo, hi] = PACE[pace];
  const dLo = cd === 0 ? 0 : Math.ceil(cd / hi);
  const dHi = cd === 0 ? 0 : Math.ceil(cd / lo);
  const atMax = next >= rules.maximumLevel;
  const claim = survivor.status === "claimable" || donor.status === "claimable";
  const remergeAt = (days: number): Cell => {
    if (atMax) return { k: "v_remergeMax" };
    if (dHi <= days) return { k: "v_remergeYes", v: { a: next } };
    if (dLo > days) return { k: "v_remergeNo" };
    return { k: "v_remergeMaybe" };
  };
  const s = survivor.tokenId;
  const d = donor.tokenId;
  return [
    { item: "r_count", d0: { k: "v_count", v: { n: 2 } }, d7: { k: "v_count", v: { n: 1 } }, d30: { k: "v_count", v: { n: 1 } }, tag: "certain", basis: "b_burn" },
    { item: "r_lost", d0: { k: "v_inWallet", v: { id: d } }, d7: { k: "v_burned", v: { id: d } }, d30: { k: "v_burned", v: { id: d } }, tag: "certain", basis: "b_burn" },
    { item: "r_level", d0: { k: "v_levelPair", v: { a: L } }, d7: { k: "v_level", v: { a: next } }, d30: { k: "v_level", v: { a: next } }, tag: "certain", basis: "b_level" },
    { item: "r_power", d0: { k: "v_powerPair", v: { p: fmt(p), t: fmt(p * 2) } }, d7: { k: "v_powerNext", v: { p: fmt(pNext) } }, d30: { k: "v_powerNext", v: { p: fmt(pNext) } }, tag: "certain", basis: "b_power" },
    { item: "r_rewards", d0: { k: "v_split", v: { claim: claim ? 1 : 0 } }, d7: { k: "v_merged", v: { id: s } }, d30: { k: "v_merged", v: { id: s } }, tag: "certain", basis: "b_rewards" },
    { item: "r_cooldown", d0: { k: "v_cdNow" }, d7: cd === 0 ? { k: "v_cdNone" } : { k: "v_cdNew", v: { b: fmt(cd) } }, d30: cd === 0 ? { k: "v_cdNone" } : { k: "v_cdNew", v: { b: fmt(cd) } }, tag: "certain", basis: "b_cooldown" },
    { item: "r_remerge", d0: { k: "v_remergeNow" }, d7: remergeAt(7), d30: remergeAt(30), tag: "scenario", basis: "b_scenario" },
    { item: "r_sell", d0: { k: "v_count", v: { n: 2 } }, d7: { k: "v_count", v: { n: 1 } }, d30: { k: "v_count", v: { n: 1 } }, tag: "certain", basis: "b_sell" },
    { item: "r_earn", d0: { k: "v_shareDep" }, d7: { k: "v_noForecast" }, d30: { k: "v_noForecast" }, tag: "unknown", basis: "b_earn" },
    { item: "r_price", d0: { k: "v_unknownPrice" }, d7: { k: "v_unknownPrice" }, d30: { k: "v_unknownPrice" }, tag: "unknown", basis: "b_price" },
    { item: "r_params", d0: { k: "v_paramsNow" }, d7: { k: "v_paramsLater" }, d30: { k: "v_paramsLater" }, tag: "unknown", basis: "b_params" },
  ];
}

export const REGRETS = ["g_lost", "g_noUndo", "g_liquidity", "g_cooldown", "g_wallet", "g_fee", "g_gate"] as const;
export type RegretKey = (typeof REGRETS)[number];
/** The official checklist opens only when this one is ticked. */
export const GATE: RegretKey = "g_gate";
export const canOpenOfficial = (ticked: Partial<Record<RegretKey, boolean>>) => ticked[GATE] === true;

/** Calldata for merge(uint8 collection, uint256 survivorId, uint256 donorId), shown in the preview only. */
export const MERGE_SELECTOR_SIGNATURE = "merge(uint8,uint256,uint256)";
export function mergeCallText(survivor: string, donor: string) {
  return `merge(collection: 0, survivorId: ${survivor}, donorId: ${donor})`;
}
