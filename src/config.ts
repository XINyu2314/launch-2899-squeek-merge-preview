/**
 * Every network fact the site depends on, in one place.
 * Source: GET https://api.squeekchain.com/v1/economy/state (read 2026-11-02, release
 * stream-game-sepolia-test-20261026-01). Identities are re-read from the same endpoint at runtime;
 * when they differ, the official API wins and the UI says so.
 */
export const CHAIN_ID = 11155111; // Sepolia. Fixed and checked on every load and snapshot.
export const CHAIN_NAME = "Sepolia";
export const API_BASE = "https://api.squeekchain.com";
/** Public Sepolia RPCs, tried in order. Read-only eth_call / eth_chainId only. */
export const PUBLIC_RPCS = ["https://ethereum-sepolia-rpc.publicnode.com", "https://sepolia.drpc.org"];

export const IDENTITIES = {
  genesis: "0xcb98349c134ab983da5bfd80527dfe2552bdb70f", // SqueekNFT (ERC-721)
  miningProxy: "0xcd46990f8349057335289ef282c276204b6cdc62", // SqueekMining: merge(0, survivorId, donorId)
  stakingProxy: "0x4b67b739dfd832f4eac67a7aa3bc244fb74cea4f",
} as const;

/** Level tables from the official API's nft block. Index = level - 1. */
export const RULES = {
  maximumLevel: 10,
  basePower: [1000, 2200, 4840, 10648, 23426, 51536, 113380, 249436, 548759, 1207269],
  cooldownBlocks: [0, 3000, 7000, 14000, 21000, 28000, 35000, 42000, 49000, 0],
};

export const OFFICIAL_LINKS = {
  app: "https://squeekchain.com/",
  mergeDocs: "https://docs.squeekchain.com/squeeks/merge/",
  ownerActions: "https://docs.squeekchain.com/developers/owner-actions/",
  apiDocs: "https://docs.squeekchain.com/developers/api/",
  explorer: (addr: string) => `https://sepolia.etherscan.io/address/${addr}`,
};

export const SITE = {
  name: "Squeek Merge Preview",
  description: "Non-custodial merge rehearsal for Squeek holders: compare before and after, tick your regrets, then get the official checklist.",
  url: "https://xinchne.xyz/",
  author: "@xinchne_eth",
};
