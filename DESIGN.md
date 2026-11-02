# Squeek Merge Preview · implemented design

## Overview

面向 Squeek 持有人的合并决策台。沿用炭黑底、琥珀操作色与仓鼠肖像；桌面按「选择 → 对照 → 后悔点」排列。首屏直接进入持仓选择，没有营销区或独立数据大盘。本次修订保留原有设计，只调整窄屏卡片、钱包弹层和历史快照状态。

样式的唯一来源是 `src/styles.css`；页面模式在 `src/App.tsx`。布局、色彩、字体均沿用现有实现。

## Colors

以下语义 token 均定义于 `src/styles.css:22`，组件使用语义角色，底层色值保持十六进制：

| Token | Value | Role |
| --- | --- | --- |
| `--color-bg` | `#16130f` | 页面 |
| `--color-surface` | `#1d1a15` | NFT、输入框、快照、弹层 |
| `--color-surface-raised` | `#24201a` | 按钮 |
| `--color-surface-hover` | `#2c2720` | 悬停、已选分段按钮 |
| `--color-border` / `--color-border-strong` | `#3d362c` / `#574e41` | 结构 / 控件边线 |
| `--color-text` / `--color-text-secondary` / `--color-text-muted` | `#f4efe6` / `#d8cfbf` / `#b3a893` | 正文 / 次级文字 / 提示 |
| `--color-accent` / hover / pressed | `#f2a93b` / `#f7c77e` / `#d98f22` | 主按钮、保留方 |
| `--color-on-accent` | `#16130f` | 强调底上的文字 |
| `--color-certain` | `#7fd1a0` | 确定、可领奖 |
| `--color-scenario` | `#8fb8f2` | 情景、质押中 |
| `--color-unknown` | `#c9aef0` | 不可知、冷却中 |
| `--color-danger` | `#f29a80` | 被合并方、错误 |
| `--color-focus` | `#f4efe6` | 2px 焦点环，offset 2px |

状态均带文字和图标，不仅依靠颜色。默认页面探针的实际文字对比度检查通过；这不代表所有图像或半透明组合都经过测量，详见 `artifacts/validation.md`。

## Typography

`--font`：PingFang SC → Hiragino Sans GB → Noto Sans SC → Microsoft YaHei → system-ui → Apple/Segoe UI/Roboto → sans-serif。站点不下载字体；使用设备字体。验证截图的中文使用外部测试环境提供的 Noto Sans SC，字体文件未加入网站或提交包。

| Token | Size | Usage |
| --- | --- | --- |
| `--text-xs` | 12px / .75rem | 徽标、标签、依据、tokenId |
| `--text-sm` | 14px / .875rem | 控件、提示、表格 |
| `--text-md` | 16px / 1rem | 正文、输入框、h3 |
| `--text-lg` | 20px / 1.25rem | h2 |
| `--text-xl` | 28px / 1.75rem | h1 |

只使用 400、600 两档字重；正文行高 1.55，h1 1.15，h2 1.2，h3 与 NFT 名称 1.3，徽标与禁选原因 1.4。h1 使用 `text-wrap: balance`，解释文字使用 `pretty`，正文介绍宽度限制为 60ch，提示为 70ch。数值用 `.tnum` 的 tabular-nums；地址允许任意断行，不隐藏关键值。手机输入框保持 16px。

## Layout

`--space-1…6` 为 4、8、12、16、24、32px。页面 `main` 最大宽 1480px，桌面内边距 24px。`.desk` 三列比例 1.05 / 1.6 / .95，最小宽度分别为 300 / 420 / 280px，间距 32px；右栏在大屏 sticky，距顶部 16px。

- ≤1180px：选择与对照两列；后悔点移至下一行，取消 sticky。
- ≤900px：同序单列，页面内边距 16px；NFT 两列；对照表逐行展示 Day 0 / +7 天 / +30 天及依据。隐藏表头后由各单元格的 `data-label` 保留列名。
- ≤640px：钱包弹层贴底、全宽、下方增加 safe-area；地址表单可换行。
- ≤380px：NFT 卡内肖像与文字纵向排列，让完整英文 Claimable 徽标留在卡内；不缩字号、不裁切。

实际检查了 320、360、375、390、900、1440px 的中英文布局，无页面横向滚动。390px 首屏可见产品名、连接入口及可选择的 NFT。快照并排区使用 `auto-fit` 与 180px 最小列宽，窄屏自然堆叠。

## Elevation & Depth

主要使用背景明度和细边框分层，不添加浮动阴影。选中的 NFT 使用同色边框及 inset 1px 描边来强调身份；这是选择状态。钱包 backdrop 与原生 dialog backdrop 均为 `rgb(0 0 0 / .6)`；钱包层 `z-index: 20`。原生 dialog 由浏览器放入 top layer。

## Shapes

`--radius-sm/md/lg` 为 6 / 10 / 14px：肖像与分段按钮、普通控件、NFT/快照/弹层。状态徽标为 999px 胶囊。肖像为仓鼠本体，圆角裁切只作用于装饰图，不裁切文字。

## Components

- `.btn` / `.btn-primary` / `.btn-quiet`：40px 最小高度，默认、强调、安静三种角色；hover、pressed、disabled、focus-visible 状态。钱包行 `.row` 最小 48px。
- `ConnectControl`（`src/wallet.tsx`）：EIP-6963 与 Coinbase 连接入口；弹层通过 portal 放在 body 下，只让背景 `#app-shell` inert。打开时移入焦点，Tab/Shift+Tab 在弹层内循环，×、背景和 Escape 均关闭，关闭后恢复触发按钮焦点。连接失败可重试。
- NFT `.card`（`src/App.tsx`）：明确保留方与被合并方，`aria-pressed` 暴露状态。质押、冷却或等级不符时禁选并显示原因。`HamsterArt` 在 `src/art.tsx`。
- `StatusBadge` / `TagChip`（`src/App.tsx`）：状态与结论标记，图标、文字、颜色同时表达。确定 / 情景 / 不可知标签始终与结论同行。
- `.cmp`：单一 Day 0 / +7d / +30d 格式；每行包含依据。用户区块速度假设不作为收益预测。
- 历史快照 `.snapshot-view`：显示保存时间、归属、chainId、数据源和保存的持仓摘要；与当前持仓无关。历史对照使用保存的翻译键和值，禁止调整情景或重新保存；“返回当前预演”恢复编辑。缺少规则证据的旧快照明确标记相关结论为不可知。
- `.regrets` / `.official`：理解不可逆的复选框控制检查单。历史查看为只读，不以旧持仓开启当前操作检查单。
- `.state` / `.state-error` / `.skeleton`：空态提供下一步；失败保留快照；RPC 无法核实存入者时省略 NFT 并说明。
- 分享图（`src/share.ts`）：1200×630 Canvas，保留原有 44/28/22px 字体。正文在 708px 可用宽度内按 `measureText` 换行，行距至多 36px，正文末行基线不超过 500px，页脚署名在 560px。

界面过渡使用 `--dur:160ms`、`cubic-bezier(.2,0,0,1)`，弹层进入 200ms；只过渡指定属性。骨架循环和弹层进入动画仅在 `prefers-reduced-motion: no-preference` 时运行。

## Do's and Don'ts

- 新状态复用 `src/i18n.ts` 的双语 key，存储状态或 key，在渲染时翻译；不保存已经翻译的错误字符串。
- 历史结论读取 `snapshotRows`，当前预演使用 `buildRows`；不得把新规则套到旧时间戳上。
- 继续复用 `.desk` 的阅读顺序和既有 token；修改卡片时同时检查英文 320px 与中文 390px。
- 保持禁选原因、完整 tokenId、不可逆声明及非托管边界可读。新增页面沿用顶栏、布局间距、字号与状态标签，不添加收益承诺、交易控制或独立视觉系统。

设计检查参考 Jakub Krehel 的 Better Interface（MIT）；文档结构参考 Paul Bakaus 的 Impeccable document guide（Apache-2.0）。本文为最终源码的实现记录，并非上游文档复制；来源与许可证见 `artifacts/design-guidance-LICENSE.txt` 和 `artifacts/validation.md`。
