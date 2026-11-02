/** Baseline snapshots, kept in this browser's localStorage only. Nothing is uploaded. */
import { CHAIN_ID } from "./config.ts";
import type { Squeek, Status } from "./data";
import { buildRows, type CompareRow, type Pace } from "./rules.ts";

export type SourceId = "collection" | "api" | "rpc";

export type Snapshot = {
  id: string;
  createdAtUtc: string;
  owner: string;
  chainId: number;
  source: SourceId;
  holdings: { tokenId: string; status: Status; level: number | null }[];
  survivor: Squeek;
  donor: Squeek;
  pace: Pace;
  /** Translatable conclusions captured at save time; never rebuilt from today's rules. */
  comparison?: CompareRow[];
};

export function snapshotRows(s: Snapshot): CompareRow[] {
  if (s.comparison) return s.comparison;
  // Older snapshots have no rule evidence. Retain their saved token facts, but do not
  // invent historical power/cooldown values by applying the current economy table.
  return buildRows(s.survivor, s.donor, s.pace, { maximumLevel: Infinity, basePower: [], cooldownBlocks: [] }).map((row) =>
    ["r_power", "r_cooldown", "r_remerge"].includes(row.item)
      ? { ...row, d0: { k: "v_ruleUnsaved" }, d7: { k: "v_ruleUnsaved" }, d30: { k: "v_ruleUnsaved" }, tag: "unknown", basis: "b_ruleUnsaved" }
      : row,
  );
}

const key = (owner: string) => `smp:snapshots:${owner.toLowerCase()}`;

export function listSnapshots(owner: string): Snapshot[] {
  try {
    const raw = localStorage.getItem(key(owner));
    const arr = raw ? (JSON.parse(raw) as Snapshot[]) : [];
    // A snapshot from another chain is never shown as if it were Sepolia.
    return arr.filter((s) => s && s.chainId === CHAIN_ID);
  } catch {
    return [];
  }
}

export function saveSnapshot(s: Omit<Snapshot, "id" | "createdAtUtc" | "chainId">): Snapshot {
  const snap: Snapshot = { ...structuredClone(s), id: `${Date.now().toString(36)}-${s.survivor.tokenId}-${s.donor.tokenId}`, createdAtUtc: new Date().toISOString(), chainId: CHAIN_ID };
  const all = [snap, ...listSnapshots(s.owner)].slice(0, 30);
  localStorage.setItem(key(s.owner), JSON.stringify(all));
  return snap;
}

export function deleteSnapshot(owner: string, id: string): Snapshot[] {
  const all = listSnapshots(owner).filter((s) => s.id !== id);
  localStorage.setItem(key(owner), JSON.stringify(all));
  return all;
}

export function downloadBlob(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
