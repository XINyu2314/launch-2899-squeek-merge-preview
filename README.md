# Squeek Merge Preview（合并预演）

持有人合并 Squeek 之前的**非托管决策台**：选两只 Squeek → Day 0 / +7 天 / +30 天前后对照与后悔点 → 本地 Baseline 快照 → 勾选「我理解合并可能不可逆」后才给出官方合并检查单。站点本身**不发起任何合并交易**。

叙事：Direct · Utilities for holders — non-custodial tools for staking, merging, and managing Squeeks。页脚署名 @xinchne_eth，部署优先 https://xinchne.xyz（本仓库只交付静态导出 `dist/`，托管不在本次范围内）。

## 非托管边界

- 不代签、不保管私钥或助记词、不托管 NFT 或代币。没有后端，页面不收集任何密钥输入。
- 不发送 `merge`、`approve`、`setApprovalForAll` 等任何写交易；源码里没有 `sendTransaction`、`writeContract`、`signMessage` 调用（`grep` 可验证）。钱包连接只读取地址和 chainId；chainId 不对时只提供 `wallet_switchEthereumChain` 切换。
- 「预览签名弹窗」是纯界面展示，按钮写着「关闭预览，不广播」，不会把任何请求发往钱包。
- 官方检查单里的外链只有：squeekchain.com、docs.squeekchain.com（合并、持有人操作）、sepolia.etherscan.io 上的 SqueekMining 合约页。
- 钱包 SDK（来自 npm，版本见 `package-lock.json`）：wagmi 3.7.10、viem 2.57.14、@coinbase/wallet-sdk 4.4.0、@tanstack/react-query 5。连接方式：EIP-6963 注入式浏览器钱包、Coinbase Wallet / Smart Wallet；手机端提供「在 MetaMask / Coinbase Wallet / Phantom 中打开」。不使用 WalletConnect（简报没有提供 project ID，也不需要中继）。

## 数据来源与合并规则

- 链：Sepolia，chainId **11155111**，写死在 `src/config.ts`，每次读取和每份快照都校验；不符即报错，不显示数据。
- 真钱包持仓：`GET https://api.squeekchain.com/v1/accounts/{address}`（官方 API，分页读取）。官方图像来自 `GET /v1/squeeks/{tokenId}` 的 `imageDataUri`，作为隔离的 `<img>` 显示。
- 官方 API 不可用时：合约不支持按地址枚举，所以用户输入 tokenId，站点经公共 Sepolia RPC（`https://ethereum-sepolia-rpc.publicnode.com`，备用 `https://sepolia.drpc.org`）调用 `ownerOf` 与 `SqueekMining.position(0, id)` 只读核对。
- 合约地址与等级表来自 `GET /v1/economy/state`（2026-11-02 读取），运行时再次读取；与内置值不一致时以官方为准并提示。
- 合并规则（docs.squeekchain.com/squeeks/merge/ 与 developers/owner-actions/）：一次合并恰好两只、同等级、低于最高等级、无待生效算力变化、都过了冷却；由持有人指定保留方（survivor），另一只（donor）永久销毁；保留方升一级、保留 ID 和图像、接收两只的未领取 SQK；新等级算力下一轮生效；方法 `merge(uint8 collection=0, uint256 survivorId, uint256 donorId)`，不需要任何授权。
- 读不到的字段写「未提供」（例如 RPC 路径下的当前 Squeek 区块高度）。不显示 APY，不用随机数。

## 预演步骤

1. 打开页面，默认在「我的收藏」（20 只固定持仓）。或切到「钱包」：连接钱包，或粘贴任意 0x 地址只读读取。
2. 在左栏点一只设为**保留方**，再点一只同级、可合并的设为**被合并方**。质押中、冷却中、等级不同的会灰显并写明原因。可「互换保留方」。
3. 中栏生成 Day 0 / +7 天 / +30 天对照，每行带「确定 / 情景 / 不可知」色标和图标，并写明依据。情景假设（Squeek 区块速度区间）可切换。
4. 点「保存 Baseline 快照」：记录 UTC 时间、地址、chainId、tokenId 与状态摘要、数据源。同一地址可勾选最多 3 份并排对比，可「导出 JSON」「复制摘要」「下载分享图」（PNG，署名 @xinchne_eth）。快照存在浏览器 localStorage，清缓存会丢。
5. 右栏逐条确认后悔点；勾选「我理解合并可能不可逆」后才展开官方合并检查单（网络、合约地址、只读方法名、风险提示、官方链接、签名弹窗预览）。

## 「我的收藏」的固定数据

`src/data.ts` 写死简报给出的 20 条（tokenId 1001–1020，中英文昵称、状态、是否可合并），不随机、不联网。简报没有给等级，这里统一为 Lv 1，所以任意两只「可合并」的都构成合法组合。这组数据用于在不连接钱包时完整走一遍流程；界面里不标注其来历，说明只放在本 README 和页脚「关于与限制」。卡面是本站绘制的仓鼠 Squeek 肖像（配饰：蝴蝶结、叶子、围巾、星星发夹），甜品名只是昵称。真钱包模式显示官方链上图像。

两种模式状态完全隔离：各自的持仓、选择和快照（快照按地址分键，「我的收藏」用 `my-collection`）。

## 限制

- 「+7 天 / +30 天」是对照剧本，不是预测。冷却按 Squeek 区块计，换算成天数只能依赖用户选的区块速度情景；SQK 收益与市价标为不可知。
- 质押中的 Squeek 在本工具中不可选；官方质押合约内的合并流程请以官方应用为准。
- RPC 降级路径拿不到当前 Squeek 区块高度，所以 `nextMergeBlock > 0` 的一律按不可合并处理并写明原因。
- 手机「在钱包中打开」行使用品牌色的通用钱包图标，没有内置 MetaMask / Phantom 官方标；没有 Rabby 行（参考里没有给出其链接格式）。
- `og:image` 用相对路径 `./og.png`，以适配网关子路径；部分社交平台要求绝对 URL，部署到 xinchne.xyz 后可改为绝对地址。

## 安装、预览与重建

```bash
npm ci            # 安装依赖（Node 20+，本次用 Node 24 / npm 11）
npm run dev       # 本地开发
npm run build     # tsc --noEmit 类型检查 + vite build，输出 dist/
npm run preview   # 预览 dist/
npm test          # 合并规则单元测试（node --test）
```

`vite.config.ts` 设置 `base: "./"`，`dist/` 中所有资源都是相对路径，可直接放到任意静态托管、IPFS 网关子路径或 ENS 名下。单页应用，无路由。

## 本次检查结果（2026-11-02）

| 命令 | 结果 |
| --- | --- |
| `npx tsc --noEmit` | 通过，无错误 |
| `npx vite build` | 通过：index.html 1.4 kB，CSS 14.6 kB，JS 295 kB + 103 kB（gzip 95 kB + 34 kB） |
| `npm test` | 4/4 通过 |
| Playwright 交互脚本（1440 与 390，对 `dist/` 在本地子路径 `/preview/` 下运行） | 46/46 通过：20 张卡、6 只灰显、选两只生成 11 行对照且每行有标签、未勾选理解项时检查单锁定、勾选后展开、保存 3 份快照并排、导出 JSON、分享图 PNG、签名预览打开与关闭、切 EN 后界面无中文残留、刷新后快照恢复并可重新打开、模式隔离、地址校验错误、无横向滚动、注入钱包未收到任何 send/sign/approve 请求、无页面错误 |
| 真钱包路径（官方 API，地址 0x32cd…cc41） | 列出 9 只持仓（均为质押中，正确灰显） |
| 设计探针 `taste.mjs`（320 / 390 / 1440） | 16/16 通过 |

详细记录见 `artifacts/validation.md`；截图 `artifacts/screenshot-1440.png`、`artifacts/screenshot-390.png`；给审核员的说明见 `artifacts/for-reviewers.md`。

---

**English summary.** Squeek Merge Preview is a static, non-custodial pre-merge desk for Squeek holders on Sepolia (chainId 11155111). Pick a survivor and a donor, compare Day 0 / +7d / +30d with every row tagged Certain, Scenario or Unknown, save local snapshots (compare 3 side by side, export JSON, copy a summary, download a share image signed @xinchne_eth), tick the regret points, and only after "I understand a merge may be irreversible" see the official merge checklist. The site never sends a transaction. Install with `npm ci`, build with `npm run build`, preview with `npm run preview`.
