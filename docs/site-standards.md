# OSA 站内排版、日期与全路由验收

## 规则在哪里生效

`src/styles/tokens.css` 是本仓的排版与尺寸角色 owner。它是普通 CSS，既不依赖 Tailwind 编译语法，也不依赖浏览器 JavaScript。本站保留学术主页、交互说明、海报和幻灯片的语义变体；不要求其他网站使用 OSA 的数值或字体。

| 页面族 | 实际消费链 | 说明 |
| --- | --- | --- |
| 中英文论文页、实验比较页及两种实验布局、语言 404 | Layout → global.css → tokens.css | Tailwind 字号、字重、行距和间距工具类也映射到同一个 owner；基础样式位于 `base` 层，明确选择的工具类能够生效。 |
| 两个旧入口 `/osa/`、`/osa/slides/` | RedirectLayout → global.css → tokens.css | 原 meta refresh、canonical、hreflang 和 noindex 保留；延迟跳转时仍有标准化正文与链接。 |
| GitHub Pages 独立 `/osa/404.html` | public/404.html 的生成样式区域 ← tokens.css | 保持独立静态路径、自包含、英语默认及中文入口；不依赖错误 URL 下的相对资源。仅生成区域自动同步，其余页面内容仍在 public/404.html 编辑。 |
| `/osa/slides-raw/` | src/slides.src → build-slides-html.mjs → public/slides-raw/index.html | 构建器嵌入相同的 tokens；生成文件不提交、不手改；保持英语原始幻灯片。 |
| 中英文海报 | Layout + poster.css + PosterHeader → tokens.css | 普通控制栏用屏幕角色，画布内用 pt/in 角色。 |

`npm run styles:sync` 更新独立 404 的生成区域。实际 dev/build 集成也会同步它并生成 raw slides。构建末尾检查两份嵌入样式与 owner **逐字一致**；每份 HTML 必须加载 owner 并具有真实 body 消费链。生成一个孤立规则文件不能满足检查。

## 字体、字号与行距

| 角色 | 基准 | 消费位置 |
| --- | --- | --- |
| `font-body` | Times New Roman + 中日韩衬线回退 | 论文、海报和幻灯片正文；平台可用字体不同，但字体栈由同一处决定。 |
| `font-editorial` | Georgia + Times/中文衬线回退 | 实验说明的层次标题。 |
| `font-ui` | 系统无衬线 + Noto Sans 回退 | 交互说明、控件及数值标签。 |
| `font-code` | SFMono/Consolas/Liberation Mono/Menlo | BibTeX、代码；代码原文不做日期改写。 |
| 普通页面根字号、正文 | 14px、1rem | 保留本站原有 14px 基准。 |
| 论文 section / subsection / lead / caption / meta | 1.875 / 1.25 / 1.125 / .875 / .75rem | 通过 `text-section` 等语义类调用；禁止回到任意 `text-3xl` 或字面字号。 |
| 实验 body / caption / meta / label / micro | 15 / 13 / 12 / 11 / 10px | micro 限小图示及辅助标签；主说明使用 body/lead。标题和数值各有命名角色。 |
| 普通行距 | 1 / 1.1 / 1.2 / 1.3 / 1.4 / 1.5 / 1.6 / 1.65 / 1.7 | 控件、展示、标题、紧凑文本、图注、正文、阅读和宽松段落依语义选择。 |
| 字重 | 400 / 500 / 600 / 700 / 750 / 900 | 正文、轻强调、次强调、粗体、实验强标签、幻灯片字标。`b/strong` 明确消费粗体，避免原生 `bolder` 失控。 |

不在组件内新增裸 `font` shorthand、字号、字重、字体栈、行距或字距。先选择已有角色；确需新角色时在 owner 命名并说明用途。相近的实验文字大小与行距已经归并，论文图示中的数值、公式、作者、论文内容及引用保持原义。

## 间距、宽度与物理画布

普通屏幕使用 `--osa-space-unit: .25rem`，在本站根字号下为 3.5px；小标签允许半单位。Tailwind 的 p/m/gap 与局部 CSS 都消费该单位。内容上限由 `width-page`、`width-study`、`width-comparison`、`width-prose` 等角色管理；响应式图示的坐标、长宽比和控件命中区域与正文留白区分处理。

海报维持 **84×42in，四列，7.4in header、33in content、1.6in footer**。其布局间距以 `.01in` 为单位；标题119pt、作者53pt、单位37pt、section66pt、subsection52pt、body46pt、caption30pt、formula36pt、footer38/26/24pt 均集中在 owner。现有图片最大高度与四列几何保持；普通网页的打印 footer 隐藏规则不能吞掉海报 footer。`@page` 的物理纸张描述及缩放算法属于固定画布约束，由双浏览器打印几何与 Chromium PDF 验证守护。

幻灯片维持 **1920×1080，12 张，双向 fit**。字号和所有文本留白引用演示角色；间距单位保持1px，以保存已经确认的几何。slides 3–11 的标题54px、title60px、Thanks135px；标题锚点 left150/top76、divider 给校徽留360px、校徽100×100与位置保持。`line-height:0` 仅用于不承载文本的 wrapper；实际 `.slide` 恢复共享正文行距，避免文本继承零行距。KaTeX 内部的字形和基线几何由 KaTeX 管理，外层公式字号仍由本站控制。Thanks 末页不会重新出现 Paper/Code 链接。

## 日期与精度

`src/utils/date-format.mjs` + `DateText.astro` 是日历显示入口：

- 完整日期：中文 `2026年6月7日`，英语 `2026-06-07`。
- 只有月份：中文 `2026年6月`，英语 `2026-06`；只知道年份保留年份。不会补造日。
- 严格校验闰年、月份与日期；不通过 `Date` 转换日历值，因此不会随运行环境时区跨日。
- Footer 消费实际 Git last-updated 字符串；海报消费原有 conference 月份字段，在显示边界投影。原始双语 JSON、BibTeX、JSON-LD、URL、论文年份和科学数值不改写。
- 当前网站没有用户可见 timestamp UI。未来如新增，须单独定义明确时区与精度；日历 formatter 会拒绝把 timestamp 静默当成本地日期。

## 页面清单与验证入口

当前完整产物是 **18 份 HTML**：两个语言各有 paper、404、poster、slides wrapper、explore comparison、network-first、video-first 共14份，加 root redirect、slides redirect、独立404和raw slides。检查从 `dist/**/*.html` 动态枚举；新增页面会自动进入样式、日期和浏览器覆盖，不能靠固定清单遗漏新增产物。

```sh
npm ci
npm run styles:sync
npm run test:standards
npm run build
npx playwright install --with-deps chromium webkit
npx playwright test
```

本地 source/output guard 拒绝孤立 owner、裸字号、裸间距、不存在的 token、非标准日期以及没有布局入口的 HTML；单测包含好 shell 中的坏正文、未知 token、裸日期、年月精度、闰年与时区负例。`test-results/standards/route-inventory.json` 记录实际18页及加载链。

真实浏览器的 `e2e/site-standards.spec.ts` 在 Chromium 与 WebKit 分别覆盖每份 HTML 的1280×956和440×956；可换主题的页面也覆盖两种主题。它收集可见文字的字体、字号、字重和行距，检查横向溢出/祖先裁切，验证时间标签与真实跳转，再对实际正文、间距、宽度做 token 扰动并恢复。宽度干预必须真实改变页面元素矩形；每次改与恢复均跨渲染帧测量。原始 slides 及 iframe 内文都进入检查；实验节点和 details 使用真实点击打开。

额外验收包括两语言海报四列无裁切、完整 footer、84×42in 打印几何和单页 PDF；12张幻灯片在1920×1080、1366×700、1280×800的单次缩放、标题锚点与校徽间距。截图与 computed JSON/PDF 是视觉审查输入；浏览器脚本跑通后仍需检查实际截图，不以构建成功代替视觉确认。

## 发布与证据

沿用 `.github/workflows/astro.yml` 的手动 feature-branch 路径。维护者选择当前分支并提供40位 `expected_sha`；job 必须读回同一 SHA 才会安装、构建和运行浏览器。feature branch 不部署，`main` 才进入现有 Pages deploy。旧 smoke/method-explorer/study-lab 检查保留；新增 WebKit 标准测试与 Chromium 一起运行，浏览器缓存由锁文件决定，证据保留3天。

长期合同在本文件和 `DESIGN.md`；当前候选验收、合并与部署身份以 [PR #19](https://github.com/wangrui2025/osa/pull/19) 和 [Actions](https://github.com/wangrui2025/osa/actions/workflows/astro.yml) 的真实记录为准。构建、源码检查或测试脚本存在不等于已通过浏览器、已合并或已部署。回退使用该 PR 的逆向变更。
