export type Status = "idle" | "staked" | "cooling" | "claimable";

export type Squeek = {
  tokenId: string;
  nameZh: string;
  nameEn: string;
  status: Status;
  /** null when the source does not provide it. */
  level: number | null;
  mergeable: boolean;
  /** Extra state the source reported, shown as-is. */
  note?: { zh: string; en: string };
  image?: string;
};

type Row = [number, string, string, Status, boolean];

/** My collection: the 20 fixed holdings from the brief. Not random, not fetched. Level 1 throughout. */
const ROWS: Row[] = [
  [1001, "糯米团", "Sticky Rice", "idle", true],
  [1002, "花生酥", "Peanut Crisp", "staked", false],
  [1003, "芝麻球", "Sesame Ball", "idle", true],
  [1004, "小汤圆", "Tangyuan", "cooling", false],
  [1005, "奶呼呼", "Milk Puff", "idle", true],
  [1006, "泡芙", "Cream Puff", "idle", true],
  [1007, "豆沙包", "Red Bean Bun", "staked", false],
  [1008, "焦糖卷", "Caramel Roll", "idle", true],
  [1009, "月光糖", "Moon Candy", "idle", true],
  [1010, "蜜桃酱", "Peach Jam", "claimable", true],
  [1011, "芋泥球", "Taro Ball", "idle", true],
  [1012, "抹茶卷", "Matcha Roll", "cooling", false],
  [1013, "草莓大福", "Strawberry Mochi", "idle", true],
  [1014, "芝士堡", "Cheese Burger", "staked", false],
  [1015, "布丁杯", "Pudding Cup", "idle", true],
  [1016, "椰蓉包", "Coconut Bun", "idle", true],
  [1017, "黑糖珍珠", "Brown Sugar Boba", "claimable", true],
  [1018, "杏仁豆腐", "Almond Tofu", "idle", true],
  [1019, "提拉米苏", "Tiramisu", "cooling", false],
  [1020, "棉花糖", "Cotton Candy", "idle", true],
];

export const COLLECTION: Squeek[] = ROWS.map(([id, zh, en, status, mergeable]) => ({
  tokenId: String(id),
  nameZh: zh,
  nameEn: en,
  status,
  level: 1,
  mergeable,
}));

export const COLLECTION_OWNER = "my-collection";
