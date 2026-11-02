/** Baseline snapshots, kept in this browser's localStorage only. Nothing is uploaded. */
import { CHAIN_ID } from "./config";
import type { Squeek, Status } from "./data";
import type { Pace } from "./rules";

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
};

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
  const snap: Snapshot = { ...s, id: `${Date.now().toString(36)}-${s.survivor.tokenId}-${s.donor.tokenId}`, createdAtUtc: new Date().toISOString(), chainId: CHAIN_ID };
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
