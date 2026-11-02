# 修订验证记录 · 2026-11-03

## 范围与方法

本轮只修复报告中复现的 9 项问题，保留已验收的 React / TypeScript / Vite、炭黑与琥珀设计、合约地址、chainId、SDK 和持仓数据。源码及锁文件完整保留，重建并交付 `dist/`。补齐审核页、截图、设计文档和逐项 JSON 回复。

先对原始 `dist/` 的副本运行 Chromium 复现，再修改源码。之后直接验证重建的生产导出，服务位于本地 `/preview/` 子路径，所有 API / RPC 及钱包测试均使用确定性夹具。该服务由测试脚本在一个前台进程内启动和关闭。截图没有改图或拼接。

由于不能修改仓库的 `node_modules/`，将原 manifest/lockfile 和源码复制到 `/tmp/squeek-revision-build/`，执行 `npm ci --prefix /tmp/squeek-revision-build --cache /tmp/squeek-revision-cache --no-audit --no-fund`，在该副本运行生产构建和类型检查，再复制导出回仓库。未加入依赖归档、缓存、字体或浏览器。Node 24，npm 11。

最后的默认 `rg --files --hidden` 未列出 artifacts 和 `.imd-responses.json`，而 `--no-ignore` 可列出。为避免交付再次漏失，根 `.gitignore` 增加这 8 个具体路径的否定规则；不开放其他 artifacts 路径，原有依赖/缓存排除保持不变。明确预算：两张截图各 1 MiB，审核页/许可证/交互记录/回复各 16 KiB，验证文档 32 KiB，探针记录 8 KiB，合计 2,203,648 bytes；实际文件均低于上限。

## 复现、修复与复查

| 报告 ID 前缀 | 原始生产页面复现 | 修复位置与结果 |
| --- | --- | --- |
| `4e2485d3` | 390×844：`.sheet.closest('[inert]').id` 为 `app-shell`，焦点 BODY；钱包行、×、背景均无法点击，Escape 才能关闭 | `src/wallet.tsx:55`、`:109`：portal 放到 body，背景独立 inert，移入/循环/恢复焦点。实际点击钱包行进入错误状态，×/背景/Escape 均可关闭；EIP-6963 测试钱包连接后关闭弹层，可切换 Sepolia 并读取持仓 |
| `798d975b` | `artifacts/for-reviewers.md` 与两张截图均不存在 | 增加审核说明及真实 1440 / 390 成品截图，均已选 #1001 与 #1003、生成 11 行对照；检查单在勾选理解项后展开 |
| `91dd951c` | API 503 或 donor #8002 消失后，1 份已存快照仍在，但打开后有 0 行对照 | `src/App.tsx:199`、`:441`：从保存的 survivor、donor、holdings 打开独立只读视图。两种状态下均恢复 11 行、原 donor、地址、时间、chainId 和来源；无需当前可合并资格 |
| `857f173f` | EN，320×700：页面 scrollWidth 331，Claimable 右缘约 330.78px | `src/styles.css:932`：≤380px 肖像与文字纵向排列。ZH/EN 在 320、360、375、390、900、1440px 均无页面横向滚动，全部状态徽标在卡内 |
| `25638aa9` | ZH 提交 bad 后切 EN，错误仍为中文 | `src/App.tsx:71`、`:130`、`:320`：只保存是否错误，在渲染时翻译。两个方向切换均即时改变错误文本，保留 aria-invalid 和描述关联 |
| `44fe7b36` | 英文 Base power 行宽 820.57px，从 x=420 绘制，超出 1200px 画布 | `src/share.ts:7`、`:60`：按 measureText 在 708px 内换行，长词/中文支持逐字符换行，行距适应剩余高度。实际下载 1200×630 PNG 并检查全部 drawText 边界，完整保留 next-round 限定语与署名，正文位于页脚上方 |
| `6417183a` | 保存时算力 2,200；接口改为 9,000 后旧时间戳的对照也变成 9,000 | `src/snapshots.ts:22`、`src/App.tsx:193`、`:565`：新快照保存独立拷贝的双语结论，历史主视图、并排卡片及 JSON 用保存数据。旧快照仍显示 2,200，新预演显示 9,000。修订前未保存规则的旧格式将相关数值标为不可知 |
| `dc6f809a` | Lv1、steady：+7d 已可合并，+30d 却写约 3–5 天后结束 | `src/rules.ts:62`：分别计算 remergeAt(7) 与 remergeAt(30)。本例两列均可再次合并；另测试 30 天仍冷却、区间不确定和最高等级 |
| `735159b1` | RPC ownerOf 是公共质押合约时，同一 #8001 被列入两个无关查询地址 | `src/api.ts:116`：只有 ownerOf 与查询地址一致才读取 position 并列入持仓；公共质押保管没有 depositor 证据时省略并明确说明。两个地址均不再列入，直接所有权正例只对真实匹配地址列出 |

## 实际执行结果

| 命令 / 检查 | 实际结果 |
| --- | --- |
| `npm --prefix /tmp/squeek-revision-build run typecheck` | exit 0，tsc --noEmit 通过 |
| `npm --prefix /tmp/squeek-revision-build test` | exit 0，8/8。见 `test/unit/rules.test.mjs`、`test/unit/snapshots.test.mjs` |
| `npm --prefix /tmp/squeek-revision-build run build` | exit 0。index.html 1,367 bytes，CSS 14,749 bytes，JS 298,608 + 102,687 bytes；Vite 关于依赖的 node:worker_threads 浏览器外置警告仍存在，已测流程无页面异常 |
| `PLAYWRIGHT_BROWSERS_PATH=/tmp/squeek-revision-browsers node test/browser/revision.mjs /tmp/squeek-revision-tools/node_modules/playwright/index.mjs` | Chromium 14/14 回归组通过。首轮缺中文字形；在外部测试环境提供 Noto Sans SC 后完整重跑并重新截图，仍 14/14 |
| `IMD_PLAYWRIGHT=/tmp/squeek-revision-tools/node_modules/playwright/index.mjs PLAYWRIGHT_BROWSERS_PATH=/tmp/squeek-revision-browsers node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste` | 16/16 通过；带中文测试字体的最终复跑也 16/16。原始指南和探针是任务输入，提交后不依赖它们构建或运行 |

最终截图与回归使用 `FONTCONFIG_FILE` 指向测试临时字体配置，字体只安装在 `/tmp/`，未改动浏览器的页面 DOM 或网站 CSS。机器可读结果保留在 [revision-checks.json](revision-checks.json) 与 [taste-checks.json](taste-checks.json)。这些是执行者记录，不是独立认证。

回归覆盖包括：20 条固定持仓、6 条禁选原因、合法选择与 11 个标签、不可逆门槛、纯 UI 预览、三份快照/并排/JSON/刷新恢复、独立历史查看、规则冻结、旧格式、数据源隔离、双向语言错误、RPC 正反归属、API 空态与错误链、EIP-6963 连接和切链。观察到的钱包方法只有 eth_accounts、wallet_requestPermissions、eth_requestAccounts、eth_chainId、wallet_switchEthereumChain；RPC 只有 eth_chainId / eth_call。无 send/sign/approve，无页面异常或本地资源 4xx。

## Better Interface 六域检查

| 域 | 覆盖与证据 | 修复 / 保留 / 限制 |
| --- | --- | --- |
| Accessibility · 已检查 | 钱包真实点击、Tab/Shift+Tab、Escape、背景 inert、焦点恢复；表单 label、aria-invalid；不可逆门槛；减少动态效果模式 | 修复弹层不可操作及焦点顺序。状态有图标与文字。探针 36 个控件达到 24px 或间距例外；16 个低于舒适的 44px。未做屏幕阅读器会话、完整无鼠标流程或完整 WCAG 审计 |
| Layout · 已检查 | ZH/EN，320/360/375/390/900/1440；实际截图；生产子路径加载；窄屏状态与历史视图 | 修复 Claimable 溢出；保留左选、中对照、右风险及 ≤900px 单列顺序。390 首屏有名称、连接和可选卡。未做浏览器原生 200% 缩放或物理设备验证；RTL 不适用于本产品支持的 ZH/EN |
| Writing · 已检查 | 地址错误双向切换；只读历史说明；RPC 未验证归属说明；旧规则未知状态 | 错误在渲染时翻译，未知参数不猜测。保留非托管/不可逆文案与可恢复的错误入口。未重新核验外部官方文档内容 |
| Typography · 已检查 | 原有五级字号、400/600 字重、手机 16px 输入框；中英文徽标和下载 PNG 实际边界；中文可读截图 | 复用现有字号，在小屏重排而非缩字；Canvas 正文测量换行。测试环境提供 Noto Sans SC，不能把 CSS 声明的首个字体名当作真实已加载字体 |
| Colors · 已检查 | 沿用语义 token；探针实际可测文字均达 4.5:1 / 大字 3:1；结论和状态同时有文字/图标 | 无需改色。没有声称每个半透明图像、交互态都测过对比度；未独立手动验证 forced-colors |
| UI · 已检查 | 选择、禁选、空、失败、只读、成功与弹层状态；实际 PNG 和桌面/手机页面；探针 reduced-motion | 保留肖像、细边框与选中态；背景 inert 不再含弹层。无 transition:all，默认页 reduced-motion 无持续动画。未在浏览器动画面板以 10% 速度播放检查 |

参考来源：Jakub Krehel 的 [Better Interface](https://github.com/jakubkrehel/skills/tree/267330e1adfc66a718fb65fa6918c1f06d0a689e/skills/better-interface)，MIT；文档方法参考 Paul Bakaus 的 [Impeccable document guide](https://github.com/pbakaus/impeccable/blob/9d715cc4f5564a990ca8345abfdd5df6dc9b41c8/skill/reference/document.md)，Apache-2.0。依照任务附带的固定版本阅读，没有为此抓取其他设计指南。许可证保留于 [design-guidance-LICENSE.txt](design-guidance-LICENSE.txt)。

## 截图与交付

- [screenshot-1440.png](screenshot-1440.png)：1440×900 视口的整页截图。
- [screenshot-390.png](screenshot-390.png)：390×844 视口的整页截图，保留手机同序单列的完整内容。
- 两张均直接拍自最终 `dist/`，选择 #1001 保留 / #1003 被合并，11 行对照已生成，理解不可逆后检查单已展开。
- [for-reviewers.md](for-reviewers.md)：一页 holder utility 说明；根目录 [DESIGN.md](../DESIGN.md)：最终源码的 token、字体、组件及响应式记录。

打包检查：默认文件枚举已包含 40 个交付路径，约 1.77 MB，总量低于 8 MiB；8 个忽略例外路径均低于各自预算。最终源码、配置和 lockfile 与已检查构建副本逐字节一致；`dist/index.html` 中的相对资源路径均指向存在的文件。提交路径中没有 node_modules、缓存、依赖压缩包或子模块。

## 限制与完成状态

**Complete for the stated revision scope.** 9 项均已复现、修复并在 Chromium 复查。WebKit 下载后因缺少系统共享库无法启动；提供的浏览器工具也因没有系统 Chrome 无法启动，故使用外部安装的 Playwright Chromium。没有将未运行的 WebKit 检查记为通过。

未连接真实钱包扩展/手机钱包或 Coinbase passkey；没有真实签名、交易或实时链上归属认证。官方 API / RPC 的未来可用性、HTTPS 上线与域名发布属于外部运行和托管阶段，本仓库交付完整相对资源静态导出。历史旧格式未存下的参数无法恢复；明确展示不可知，不伪造原始证据。
