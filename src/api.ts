/** Read-only data access: the official Squeekchain API first, public Sepolia RPC eth_call as the fallback. */
import { API_BASE, CHAIN_ID, IDENTITIES, PUBLIC_RPCS, RULES } from "./config";
import type { Squeek } from "./data";
import { toFunctionSelector } from "viem";

const POSITION_SELECTOR = toFunctionSelector("position(uint8,uint256)");

export type Identities = { genesis: string; miningProxy: string; stakingProxy: string };
export type Economy = { identities: Identities; mismatch: boolean; rules: typeof RULES; mergesOpen: boolean | null };

export class LoadError extends Error {}

async function getJson(path: string): Promise<any> {
  let res: Response;
  try {
    res = await fetch(API_BASE + path, { headers: { accept: "application/json" } });
  } catch {
    throw new LoadError("network");
  }
  if (!res.ok) throw new LoadError(`HTTP ${res.status}`);
  return res.json();
}

function checkChain(body: any) {
  const id = Number(body?.chain?.chainId);
  if (id !== CHAIN_ID) throw new LoadError(`chainId ${body?.chain?.chainId ?? "?"} ≠ ${CHAIN_ID}`);
}

/** Contract identities and level tables. Falls back to the built-in values (same source) when unreachable. */
export async function loadEconomy(): Promise<Economy> {
  const body = await getJson("/v1/economy/state");
  checkChain(body);
  const ids: Identities = {
    genesis: String(body.identities?.genesis ?? IDENTITIES.genesis).toLowerCase(),
    miningProxy: String(body.identities?.mining?.proxy ?? IDENTITIES.miningProxy).toLowerCase(),
    stakingProxy: String(body.identities?.staking?.proxy ?? IDENTITIES.stakingProxy).toLowerCase(),
  };
  const mismatch = ids.genesis !== IDENTITIES.genesis || ids.miningProxy !== IDENTITIES.miningProxy || ids.stakingProxy !== IDENTITIES.stakingProxy;
  const nft = body.nft ?? {};
  const rules = {
    maximumLevel: Number(nft.maximumLevel ?? RULES.maximumLevel),
    basePower: Array.isArray(nft.basePower) ? nft.basePower.map(Number) : RULES.basePower,
    cooldownBlocks: Array.isArray(nft.cooldownBlocks) ? nft.cooldownBlocks.map(Number) : RULES.cooldownBlocks,
  };
  return { identities: ids, mismatch, rules, mergesOpen: typeof nft.mergesOpen === "boolean" ? nft.mergesOpen : null };
}

export const isAddress = (a: string) => /^0x[0-9a-fA-F]{40}$/.test(a.trim());

type ApiToken = { tokenId: string; custody: "staking" | "wallet"; level: number; mergeState: string; nextMergeHeight: string };

function fromApi(t: ApiToken): Squeek {
  const staked = t.custody === "staking";
  const ready = t.mergeState === "ready";
  return {
    tokenId: String(t.tokenId),
    nameZh: `Squeek #${t.tokenId}`,
    nameEn: `Squeek #${t.tokenId}`,
    status: staked ? "staked" : ready ? "idle" : "cooling",
    level: Number.isFinite(Number(t.level)) ? Number(t.level) : null,
    mergeable: !staked && ready,
    note: ready || staked ? undefined : { zh: `状态 ${t.mergeState}，可合并区块 ${t.nextMergeHeight}`, en: `State ${t.mergeState}, merge block ${t.nextMergeHeight}` },
  };
}

export type AccountResult = { tokens: Squeek[]; claimableBaseUnits: string | null; source: "api" };

/** GET /v1/accounts/{address}, every page. */
export async function loadAccount(address: string): Promise<AccountResult> {
  const tokens: Squeek[] = [];
  let claimable: string | null = null;
  let cursor: string | null = null;
  for (let page = 0; page < 20; page++) {
    const q = new URLSearchParams({ limit: "100", ...(cursor ? { cursor } : {}) });
    const body = await getJson(`/v1/accounts/${address.trim().toLowerCase()}?${q}`);
    if (body.status !== "available") throw new LoadError(body.reason ?? "unavailable");
    checkChain(body);
    claimable ??= body.rewards?.claimableBaseUnits ?? null;
    for (const t of body.tokens ?? []) tokens.push(fromApi(t));
    cursor = body.nextCursor ?? null;
    if (!cursor) break;
  }
  return { tokens, claimableBaseUnits: claimable, source: "api" };
}

/** The official image for one Squeek, as an isolated data URI for an <img>. Null when not provided. */
export async function loadImage(tokenId: string): Promise<string | null> {
  try {
    const body = await getJson(`/v1/squeeks/${tokenId}`);
    const uri = body?.metadata?.imageDataUri;
    return typeof uri === "string" && uri.startsWith("data:image/svg+xml;base64,") ? uri : null;
  } catch {
    return null;
  }
}

// ---- RPC fallback ----
const word = (n: bigint) => n.toString(16).padStart(64, "0");

async function rpc(method: string, params: unknown[]): Promise<any> {
  let last = "rpc";
  for (const url of PUBLIC_RPCS) {
    try {
      const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
      const body = await res.json();
      if (body.error) return { error: body.error };
      return { result: body.result };
    } catch (e) {
      last = String((e as Error).message || e);
    }
  }
  throw new LoadError(last);
}

/** Check token IDs the holder supplies: ownerOf on SqueekNFT, then position(0, id) on SqueekMining. */
export async function loadByRpc(address: string, ids: string[], identities: Identities): Promise<{ tokens: Squeek[]; unverifiedTokenIds: string[] }> {
  const chain = await rpc("eth_chainId", []);
  if (Number(chain.result) !== CHAIN_ID) throw new LoadError(`chainId ${chain.result} ≠ ${CHAIN_ID}`);
  const owner = address.trim().toLowerCase();
  const out: Squeek[] = [];
  const unverifiedTokenIds: string[] = [];
  for (const id of ids) {
    const n = BigInt(id);
    const o = await rpc("eth_call", [{ to: identities.genesis, data: "0x6352211e" + word(n) }, "latest"]);
    if (o.error || !o.result) continue; // burned or never minted: ownerOf reverts
    const holder = ("0x" + String(o.result).slice(-40)).toLowerCase();
    if (holder === identities.stakingProxy.toLowerCase()) {
      // Shared custody is not evidence of this address's deposit. The available
      // RPC reads do not identify a depositor, so omit it instead of attributing it.
      unverifiedTokenIds.push(id);
      continue;
    }
    if (holder !== owner) continue;
    const p = await rpc("eth_call", [{ to: identities.miningProxy, data: POSITION_SELECTOR + word(0n) + word(n) }, "latest"]);
    const hex = String(p.result ?? "").slice(2);
    const w = (i: number) => (hex.length >= (i + 1) * 64 ? BigInt("0x" + hex.slice(i * 64, (i + 1) * 64)) : null);
    const pendingRound = w(2);
    const nextMergeBlock = w(3);
    const level = w(4);
    const pending = pendingRound !== null && pendingRound > 0n;
    out.push({
      tokenId: id,
      nameZh: `Squeek #${id}`,
      nameEn: `Squeek #${id}`,
      status: pending ? "cooling" : "idle",
      level: level === null ? null : Number(level),
      // RPC alone gives no Squeek block height to compare nextMergeBlock against, so only 0 counts as clear.
      mergeable: !pending && nextMergeBlock === 0n,
      note: nextMergeBlock && nextMergeBlock > 0n ? { zh: `可合并区块 ${nextMergeBlock}，当前高度未提供`, en: `Merge block ${nextMergeBlock}; current height not provided` } : undefined,
    });
  }
  return { tokens: out, unverifiedTokenIds };
}

