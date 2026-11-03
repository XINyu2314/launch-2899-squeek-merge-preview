/**
 * Portrait variety for HamsterArt.
 *
 * 1001–1020 are hand-authored so each collection hamster differs in fur, markings,
 * face, ears, cheeks, pose, and one small nickname prop. Dessert names stay nicknames:
 * the prop is a hint, the subject is still the hamster.
 *
 * Any other id is mixed from the same trait pools with a salted FNV-1a of the raw id
 * string. The mix does not use Number(), so ids above 2^53 stay distinct, and the same
 * id always resolves to the same look.
 */

export type EarKind = "round" | "tall" | "wide" | "flopL" | "flopR" | "point" | "tiny" | "asymm";
export type EyeKind = "bead" | "dot" | "arc" | "wink" | "sleepy" | "spark";
export type MarkKind = "none" | "blaze" | "spots" | "earTips" | "patch" | "freckles" | "cap" | "speckle";
export type Cheek = "small" | "full" | "huge";
export type Pose = "front" | "leanL" | "leanR" | "tiltL" | "tiltR";
export type PawStyle = "together" | "spread" | "raised" | "tucked";
export type BellyShape = "round" | "wide" | "small";
export type Mouth = "teeth" | "smile" | "tiny";
export type BgShape = "circle" | "diamond" | "blob" | "arch" | "dots" | "stripe";
export type Sit = "high" | "mid" | "low";
export type Accessory =
  | "rice" | "peanut" | "sesame" | "seed" | "milk" | "cream" | "bean" | "ribbon"
  | "moon" | "peach" | "swirl" | "leaf" | "berry" | "cheese" | "drip" | "flakes"
  | "boba" | "almond" | "coffee" | "fluff"
  | "bow" | "star" | "scarf" | "flower" | "bell" | "glasses" | "heart" | "none";

export type Look = {
  fur: string;
  shade: string;
  belly: string;
  blush: string;
  inner: string;
  nose: string;
  ink: string;
  bg: string;
  halo: string;
  accent: string;
  accent2: string;
  ears: EarKind;
  eyes: EyeKind;
  mark: MarkKind;
  cheeks: Cheek;
  pose: Pose;
  paws: PawStyle;
  bellyShape: BellyShape;
  mouth: Mouth;
  bgShape: BgShape;
  accessory: Accessory;
  sit: Sit;
  blushOpacity: number;
  /** Ear-tip colors [left, right] when mark is earTips. Defaults to accent / accent2. */
  tip?: readonly [string, string];
};

const COLLECTION: Record<string, Look> = {
  // 糯米团 — warm rice-cream, round, three grains.
  "1001": {
    fur: "#f0d7a4", shade: "#d7b57a", belly: "#fff6e4", blush: "#f0a898", inner: "#f0b0a6", nose: "#e07c78", ink: "#3a2918",
    bg: "#2e281c", halo: "#f0ddb0", accent: "#fff8ee", accent2: "#c9a15a",
    ears: "round", eyes: "bead", mark: "none", cheeks: "huge", pose: "front", paws: "together",
    bellyShape: "round", mouth: "teeth", bgShape: "circle", accessory: "rice", sit: "mid", blushOpacity: 0.62,
  },
  // 花生酥 — golden, speckled, wide ears, peanut.
  "1002": {
    fur: "#e4a84e", shade: "#8a5524", belly: "#f8d7a0", blush: "#eea088", inner: "#f0b09a", nose: "#d47860", ink: "#3a2714",
    bg: "#2c2418", halo: "#e8b86a", accent: "#f0c27a", accent2: "#8a5524",
    ears: "wide", eyes: "dot", mark: "speckle", cheeks: "full", pose: "tiltR", paws: "spread",
    bellyShape: "wide", mouth: "teeth", bgShape: "diamond", accessory: "peanut", sit: "mid", blushOpacity: 0.5,
  },
  // 芝麻球 — deep gold, black seeds, very round.
  "1003": {
    fur: "#d4893a", shade: "#241c14", belly: "#f3d0a4", blush: "#e89080", inner: "#e8a090", nose: "#c86858", ink: "#2b1c12",
    bg: "#261c14", halo: "#e0a060", accent: "#241c14", accent2: "#5a4636",
    ears: "round", eyes: "bead", mark: "speckle", cheeks: "huge", pose: "front", paws: "together",
    bellyShape: "round", mouth: "teeth", bgShape: "blob", accessory: "sesame", sit: "low", blushOpacity: 0.55,
  },
  // 小汤圆 — cool porcelain, tiny ears, one sesame seed, sleepy.
  "1004": {
    fur: "#f4f7fb", shade: "#d5dbe6", belly: "#ffffff", blush: "#f0b8c0", inner: "#f3c4cc", nose: "#e09098", ink: "#2c3340",
    bg: "#22262c", halo: "#e8eef6", accent: "#1c1a18", accent2: "#3a342e",
    ears: "tiny", eyes: "sleepy", mark: "none", cheeks: "huge", pose: "tiltL", paws: "tucked",
    bellyShape: "round", mouth: "tiny", bgShape: "dots", accessory: "seed", sit: "high", blushOpacity: 0.5,
  },
  // 奶呼呼 — pink-white, big eyes, waving, milk drop.
  "1005": {
    fur: "#fff1e6", shade: "#f0d4c4", belly: "#ffffff", blush: "#f3a0b0", inner: "#f6c0bc", nose: "#e88890", ink: "#3a2a28",
    bg: "#2e2822", halo: "#ffe4d6", accent: "#fffaf6", accent2: "#e4cfc2",
    ears: "round", eyes: "spark", mark: "none", cheeks: "huge", pose: "leanL", paws: "raised",
    bellyShape: "wide", mouth: "teeth", bgShape: "blob", accessory: "milk", sit: "mid", blushOpacity: 0.78,
  },
  // 泡芙 — pastry gold, tall ears, cream dollop, smiling eyes.
  "1006": {
    fur: "#f2c98e", shade: "#e0b070", belly: "#fff8ee", blush: "#f0b0a0", inner: "#f3c0b0", nose: "#e08878", ink: "#3a2a18",
    bg: "#2a2418", halo: "#f6d7a8", accent: "#fffaf4", accent2: "#e8c48a",
    ears: "tall", eyes: "arc", mark: "none", cheeks: "full", pose: "tiltR", paws: "together",
    bellyShape: "round", mouth: "smile", bgShape: "arch", accessory: "cream", sit: "mid", blushOpacity: 0.55,
  },
  // 豆沙包 — terracotta, side patch, floppy ear, red bean.
  "1007": {
    fur: "#e39a72", shade: "#b5523e", belly: "#f8d8c0", blush: "#e07068", inner: "#f0a8a0", nose: "#d06058", ink: "#3a2218",
    bg: "#2c201c", halo: "#e8a090", accent: "#a33b3a", accent2: "#f2c8bc",
    ears: "flopL", eyes: "bead", mark: "patch", cheeks: "full", pose: "leanR", paws: "together",
    bellyShape: "wide", mouth: "teeth", bgShape: "dots", accessory: "bean", sit: "mid", blushOpacity: 0.7,
  },
  // 焦糖卷 — deep caramel, pointed ears, wink, ribbon.
  "1008": {
    fur: "#c47832", shade: "#8a4e16", belly: "#f0c48a", blush: "#e09878", inner: "#e8a888", nose: "#c86848", ink: "#3a2410",
    bg: "#2a1c12", halo: "#e0a05a", accent: "#7a4010", accent2: "#f2d2a4",
    ears: "point", eyes: "wink", mark: "none", cheeks: "small", pose: "tiltL", paws: "raised",
    bellyShape: "small", mouth: "smile", bgShape: "stripe", accessory: "ribbon", sit: "mid", blushOpacity: 0.48,
  },
  // 月光糖 — silver lilac, tall ears, blaze, crescent.
  "1009": {
    fur: "#ddd6f4", shade: "#b7b0d4", belly: "#fbfaff", blush: "#e4b8d0", inner: "#e4c4d8", nose: "#d088a0", ink: "#2a2638",
    bg: "#22242e", halo: "#d4d0ea", accent: "#f4efc8", accent2: "#d8d2a8",
    ears: "tall", eyes: "sleepy", mark: "blaze", cheeks: "small", pose: "tiltR", paws: "together",
    bellyShape: "small", mouth: "smile", bgShape: "circle", accessory: "moon", sit: "high", blushOpacity: 0.4,
  },
  // 蜜桃酱 — peach fur, heavy blush, freckles, peach.
  "1010": {
    fur: "#f6b08c", shade: "#c44858", belly: "#ffe0d0", blush: "#ee6878", inner: "#f6b0a8", nose: "#e07070", ink: "#3a221c",
    bg: "#2c201c", halo: "#f0b0a0", accent: "#f29878", accent2: "#5e8e48",
    ears: "round", eyes: "spark", mark: "freckles", cheeks: "huge", pose: "leanR", paws: "together",
    bellyShape: "wide", mouth: "smile", bgShape: "blob", accessory: "peach", sit: "mid", blushOpacity: 0.84,
  },
  // 芋泥球 — lilac, oval spots, tucked paws, swirl.
  "1011": {
    fur: "#d2b4de", shade: "#7a5898", belly: "#f6ecf8", blush: "#e8a0c8", inner: "#f0c0d4", nose: "#d080a0", ink: "#322438",
    bg: "#28222e", halo: "#e0d0ee", accent: "#eadcf6", accent2: "#6e5088",
    ears: "round", eyes: "bead", mark: "spots", cheeks: "huge", pose: "front", paws: "tucked",
    bellyShape: "round", mouth: "teeth", bgShape: "circle", accessory: "swirl", sit: "low", blushOpacity: 0.6,
  },
  // 抹茶卷 — cream with matcha ear tips, pointed ears, leaf.
  "1012": {
    fur: "#e4e2c8", shade: "#6e8f46", belly: "#f6f4e4", blush: "#e8b0a4", inner: "#efc4b6", nose: "#d88878", ink: "#2c3020",
    bg: "#22261c", halo: "#c9d4a8", accent: "#6e8f46", accent2: "#3f5c30",
    ears: "round", eyes: "arc", mark: "earTips", cheeks: "small", pose: "leanR", paws: "spread",
    bellyShape: "small", mouth: "smile", bgShape: "arch", accessory: "leaf", sit: "mid", blushOpacity: 0.42,
  },
  // 草莓大福 — pink, wide ears, wink, strawberry.
  "1013": {
    fur: "#f6c9d4", shade: "#c43858", belly: "#fff0f2", blush: "#ee6888", inner: "#f6b0c0", nose: "#e07088", ink: "#3a222c",
    bg: "#2c2024", halo: "#f0c0c8", accent: "#d44868", accent2: "#5e8e48",
    ears: "wide", eyes: "wink", mark: "freckles", cheeks: "huge", pose: "tiltL", paws: "together",
    bellyShape: "wide", mouth: "smile", bgShape: "blob", accessory: "berry", sit: "mid", blushOpacity: 0.8,
  },
  // 芝士堡 — bright yellow, uneven ears, paw up, cheese wedge.
  "1014": {
    fur: "#f2c94a", shade: "#d0a020", belly: "#fff0b8", blush: "#f0b088", inner: "#f6c8a0", nose: "#e09060", ink: "#3a2c10",
    bg: "#2a2414", halo: "#f0d48a", accent: "#ffe56a", accent2: "#c49220",
    ears: "asymm", eyes: "dot", mark: "none", cheeks: "full", pose: "leanR", paws: "raised",
    bellyShape: "round", mouth: "teeth", bgShape: "diamond", accessory: "cheese", sit: "mid", blushOpacity: 0.5,
  },
  // 布丁杯 — custard with a caramel cap and a drip.
  "1015": {
    fur: "#f8e2b0", shade: "#c4842e", belly: "#fff6dc", blush: "#f0b098", inner: "#f4c4b0", nose: "#e08870", ink: "#3a2814",
    bg: "#261c12", halo: "#e8c48a", accent: "#c4842e", accent2: "#f8e6c0",
    ears: "round", eyes: "bead", mark: "cap", cheeks: "full", pose: "front", paws: "together",
    bellyShape: "round", mouth: "teeth", bgShape: "arch", accessory: "drip", sit: "low", blushOpacity: 0.5,
  },
  // 椰蓉包 — cool white, wide ears, green-gray flecks, coconut shreds.
  "1016": {
    fur: "#f3f6ef", shade: "#7f9484", belly: "#ffffff", blush: "#f0c0b8", inner: "#f4ccc4", nose: "#e09898", ink: "#2a3028",
    bg: "#232824", halo: "#e4eee6", accent: "#fffcf6", accent2: "#8fa396",
    ears: "wide", eyes: "sleepy", mark: "speckle", cheeks: "full", pose: "leanL", paws: "spread",
    bellyShape: "wide", mouth: "tiny", bgShape: "dots", accessory: "flakes", sit: "mid", blushOpacity: 0.45,
  },
  // 黑糖珍珠 — chocolate, cream blaze, tiny ears, boba pearl.
  "1017": {
    fur: "#6e4532", shade: "#4a2c1e", belly: "#f3dcc4", blush: "#e8a098", inner: "#d49890", nose: "#f0b0a8", ink: "#2a1a14",
    bg: "#1c1614", halo: "#c4a080", accent: "#1a120e", accent2: "#f3e0cc",
    ears: "tiny", eyes: "bead", mark: "blaze", cheeks: "small", pose: "tiltR", paws: "together",
    bellyShape: "small", mouth: "teeth", bgShape: "circle", accessory: "boba", sit: "low", blushOpacity: 0.55,
  },
  // 杏仁豆腐 — gray-green white, tall ears, calm eyes, almond.
  "1018": {
    fur: "#d5e0da", shade: "#a8b8b0", belly: "#f7fbf8", blush: "#f0c0bc", inner: "#f0ccc8", nose: "#e09898", ink: "#24302c",
    bg: "#1e2624", halo: "#d4e4dc", accent: "#f3e6cc", accent2: "#b89868",
    ears: "tall", eyes: "arc", mark: "none", cheeks: "small", pose: "front", paws: "tucked",
    bellyShape: "small", mouth: "smile", bgShape: "diamond", accessory: "almond", sit: "high", blushOpacity: 0.38,
  },
  // 提拉米苏 — cream, cocoa ear tips, flopped ear, coffee bean.
  "1019": {
    fur: "#f0dcc0", shade: "#6b4a32", belly: "#fff4e6", blush: "#e8b0a4", inner: "#f0c4b4", nose: "#c88870", ink: "#3a2a1c",
    bg: "#241c16", halo: "#d8c0a4", accent: "#8a5a38", accent2: "#f3e6d4",
    ears: "flopR", eyes: "wink", mark: "earTips", cheeks: "full", pose: "leanL", paws: "together",
    bellyShape: "wide", mouth: "smile", bgShape: "stripe", accessory: "coffee", sit: "mid", blushOpacity: 0.5,
    tip: ["#4a3020", "#4a3020"],
  },
  // 棉花糖 — pink, two-tone ear tips, big eyes, fluff.
  "1020": {
    fur: "#f8d4e8", shade: "#e890c0", belly: "#fff5fa", blush: "#f078a8", inner: "#f8c0d4", nose: "#e888a8", ink: "#3a2430",
    bg: "#2a2228", halo: "#f0d0e4", accent: "#f4b4d4", accent2: "#cbb8f0",
    ears: "round", eyes: "spark", mark: "earTips", cheeks: "huge", pose: "tiltL", paws: "raised",
    bellyShape: "wide", mouth: "teeth", bgShape: "blob", accessory: "fluff", sit: "high", blushOpacity: 0.72,
    tip: ["#ef8ab8", "#b9a4e8"],
  },
};

const HASH_FURS: readonly Pick<Look, "fur" | "shade" | "belly" | "blush" | "inner" | "nose" | "ink">[] = [
  { fur: "#f3d7b0", shade: "#c9956a", belly: "#fff1dc", blush: "#f0a090", inner: "#f0b0a4", nose: "#e07a78", ink: "#3a2718" },
  { fur: "#c98a55", shade: "#8a5a32", belly: "#f6d7b8", blush: "#e89080", inner: "#e8a090", nose: "#d46a62", ink: "#3a2718" },
  { fur: "#8d5a3c", shade: "#5c3824", belly: "#efd0b4", blush: "#e09890", inner: "#d89088", nose: "#e08a80", ink: "#2b1c14" },
  { fur: "#f7f3ea", shade: "#d2c6b4", belly: "#fffcf8", blush: "#f0b0a8", inner: "#f0c0b4", nose: "#e08a86", ink: "#3a3228" },
  { fur: "#d5d8dc", shade: "#8e98a4", belly: "#f4f6f8", blush: "#f0b4b0", inner: "#e7c4c4", nose: "#e09090", ink: "#2a3038" },
  { fur: "#cbb6dc", shade: "#8e74a8", belly: "#f4eaf8", blush: "#e8a0c0", inner: "#e8b4c8", nose: "#d87890", ink: "#342838" },
  { fur: "#f2c2a8", shade: "#d09070", belly: "#ffe8dc", blush: "#f09898", inner: "#f0b0a0", nose: "#e07878", ink: "#3a241c" },
  { fur: "#e7d48a", shade: "#b89440", belly: "#fff3c8", blush: "#f0b090", inner: "#f0c0a0", nose: "#e08870", ink: "#3a2c14" },
  { fur: "#d5d8bc", shade: "#7d8f62", belly: "#f3f6e6", blush: "#e8a8a0", inner: "#e8c0b0", nose: "#d88880", ink: "#2c3020" },
  { fur: "#e8c8b0", shade: "#c49878", belly: "#fff0e4", blush: "#f0a0a0", inner: "#f0b8a8", nose: "#e08078", ink: "#3a281c" },
  { fur: "#a87868", shade: "#7a5048", belly: "#f3d8cc", blush: "#e89088", inner: "#e0a098", nose: "#d07068", ink: "#2e1c18" },
  { fur: "#efe6dc", shade: "#b8a090", belly: "#fffaf6", blush: "#f0b0aa", inner: "#f3c4bc", nose: "#e08888", ink: "#3a3028" },
  { fur: "#dcc4ae", shade: "#a88060", belly: "#f8ecdf", blush: "#e8a090", inner: "#e8b4a4", nose: "#d87870", ink: "#3a2a1c" },
  { fur: "#c4b8dc", shade: "#8878b0", belly: "#eeeaf8", blush: "#e0a8c8", inner: "#e4b8cc", nose: "#d08098", ink: "#2e2838" },
  { fur: "#e8b7a2", shade: "#c4846c", belly: "#ffe4d6", blush: "#f09890", inner: "#f0b0a0", nose: "#e07870", ink: "#3a2218" },
  { fur: "#9aa7b0", shade: "#6c7c88", belly: "#e7f0f4", blush: "#e8b0b4", inner: "#e4c0c0", nose: "#d88890", ink: "#243038" },
];

const HASH_BG: readonly Pick<Look, "bg" | "halo">[] = [
  { bg: "#2a241c", halo: "#e6c48a" },
  { bg: "#241f24", halo: "#d4b6dc" },
  { bg: "#1e2428", halo: "#b7c9dc" },
  { bg: "#24241e", halo: "#c9d4a8" },
  { bg: "#2c221c", halo: "#f0b090" },
  { bg: "#26221c", halo: "#e8d2a8" },
  { bg: "#222226", halo: "#c8c6d8" },
  { bg: "#261e1c", halo: "#e7b0a4" },
];

const HASH_ACCENTS: readonly (readonly [string, string])[] = [
  ["#f2a93b", "#c9821d"],
  ["#7ea36a", "#4f7a48"],
  ["#e07a6a", "#b55248"],
  ["#f0d78a", "#c9a24a"],
  ["#e7d4c0", "#a88868"],
  ["#c9b6e0", "#8a74b0"],
  ["#f0b0a0", "#c47870"],
  ["#e8eef2", "#8aa0b0"],
];

const EARS: readonly EarKind[] = ["round", "tall", "wide", "flopL", "flopR", "point", "tiny", "asymm"];
const EYES: readonly EyeKind[] = ["bead", "dot", "arc", "wink", "sleepy", "spark"];
const MARKS: readonly MarkKind[] = ["none", "blaze", "spots", "earTips", "patch", "freckles", "cap", "speckle"];
const CHEEKS: readonly Cheek[] = ["small", "full", "huge"];
const POSES: readonly Pose[] = ["front", "leanL", "leanR", "tiltL", "tiltR"];
const PAWS: readonly PawStyle[] = ["together", "spread", "raised", "tucked"];
const BELLIES: readonly BellyShape[] = ["round", "wide", "small"];
const MOUTHS: readonly Mouth[] = ["teeth", "smile", "tiny"];
const SHAPES: readonly BgShape[] = ["circle", "diamond", "blob", "arch", "dots", "stripe"];
const SITS: readonly Sit[] = ["high", "mid", "low"];
const HASH_PROPS: readonly Accessory[] = ["bow", "star", "scarf", "flower", "bell", "glasses", "heart", "ribbon", "leaf", "none"];
const BLUSHES: readonly number[] = [0.42, 0.55, 0.7];

function fnv32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function pick<T>(arr: readonly T[], h: number, salt: number): T {
  let x = h ^ Math.imul(salt, 0x9e3779b1);
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d);
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b);
  x ^= x >>> 16;
  return arr[(x >>> 0) % arr.length];
}

function mixLook(id: string): Look {
  const h = fnv32(id);
  const [accent, accent2] = pick(HASH_ACCENTS, h, 3);
  return {
    ...pick(HASH_FURS, h, 1),
    ...pick(HASH_BG, h, 2),
    accent,
    accent2,
    ears: pick(EARS, h, 4),
    eyes: pick(EYES, h, 5),
    mark: pick(MARKS, h, 6),
    cheeks: pick(CHEEKS, h, 7),
    pose: pick(POSES, h, 8),
    paws: pick(PAWS, h, 9),
    bellyShape: pick(BELLIES, h, 10),
    mouth: pick(MOUTHS, h, 11),
    bgShape: pick(SHAPES, h, 12),
    accessory: pick(HASH_PROPS, h, 13),
    sit: pick(SITS, h, 14),
    blushOpacity: pick(BLUSHES, h, 15),
  };
}

export function lookFor(id: string): Look {
  return COLLECTION[id] ?? mixLook(id);
}

/** Stable fingerprint used to assert that portraits do not collapse together. */
export function portraitSignature(id: string): string {
  const l = lookFor(id);
  return [
    l.fur, l.shade, l.belly, l.ears, l.eyes, l.mark, l.cheeks, l.pose, l.paws,
    l.accessory, l.bg, l.halo, l.mouth, l.bgShape, l.bellyShape, l.sit, l.tip?.join(",") ?? "",
  ].join("|");
}
