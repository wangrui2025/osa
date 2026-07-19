# OSA Poster 排版设计规范

> 本文档描述 OSA 学术海报的排版约束与设计原则。
> 任何修改必须遵守本规范，否则可能导致内容溢出或布局崩坏。

---

## 1. 物理尺寸

| 属性 | 值 |
|------|-----|
| 总尺寸 | 84in × 42in |
| Header 高度 | 7.4in |
| Content 高度 | 33in（= 42 − 7.4 − 1.6，**硬约束，不可突破**） |
| Footer 高度 | 1.6in |
| 列数 | 4 列等宽 |

---

## 2. 布局结构

```
+----------------------------------------------------------+
|                        Header (7.4in)                     |
+----------------------------------------------------------+
| Col 1  |  Col 2  |  Col 3  |  Col 4  |   Content (33in)  |
|        |         |         |         |                   |
| 问题    |  方法   |  OSU   |  实验   |                   |
| 设定    |  概览   |  APFE  |  结果   |                   |
|        |         |         |         |                   |
+----------------------------------------------------------+
|                        Footer (1.6in)                     |
+----------------------------------------------------------+
```

### 内容分布（当前）

| 列 | 内容 |
|----|------|
| Col 1 | Problem Setting + Motivation + Contributions |
| Col 2 | Our Approach + Method Overview |
| Col 3 | Orthogonalized State Update (OSU) + Anatomical Prior-aware Feature Enhancement (APFE) |
| Col 4 | Quantitative Results + Qualitative Comparison |

---

## 3. 字体规范

全站统一 Times New Roman：

| 元素 | 字号 |
|------|------|
| 论文标题 | 119pt |
| 作者 | 53pt |
| 机构 | 37pt |
| Section 标题 | 66pt |
| Section 子标题 | 52pt |
| 正文 | 46pt |
| 图注 | 30pt |
| 公式 | 36pt |
| Footer 标题 | 38pt |
| Footer 正文 | 26pt |
| Footer 链接 | 24pt |

---

## 4. 颜色规范

| 用途 | 色值 |
|------|------|
| Header 背景 | `#7f9ee6` |
| Section 标题 | `#5a6fca` |
| Section 子标题 / 强调 | `#4655ab` |
| 正文 | `#1a1a1a` |
| 图注 | `#444` |
| Figure 背景 | `#f8f9fa` |
| Figure 边框 | `#e0e0e0` |
| 列分割线 | `#e8e8e8` |

---

## 5. 硬约束（不可违反）

> 以下约束是防止内容溢出的核心防线。修改前必须验证。

### 5.1 高度约束

- **Content 区域高度 = 33in**（`grid-template-rows: 7.4in minmax(0, 1fr) 1.6in`）。任何增加内容高度的改动（增大字号、增加 padding、增加 gap）必须通过压缩其他区域来补偿。
- 每列 `scrollHeight` 必须等于 `clientHeight`（无溢出）。

### 5.2 图片约束

```css
.osa-poster-figure img {
  max-height: 8in;    /* 默认值：防止图片无限放大挤占空间 */
}
```

实际上限（`src/styles/poster.css`）：默认 figure `8in`，`--flush` `7in`，`--flush .img--95` `8.5in`，table-wrap `6in`。任何调大都必须先跑 §12 checklist 的溢出验证。

### 5.3 弹性压缩

```css
.section {
  flex: 1 1 auto;
  min-height: 0;      /* 允许 section 被压缩 */
}
```

### 5.4 间距约束

```css
.column-inner {
  gap: 0.15in;        /* 不可超过 0.3in，否则总高度会超 */
}
```

### 5.5 公式块约束

```css
.formula-box {
  font-size: 36pt;    /* 当前值；调大必须重跑溢出验证 */
  padding: 0.05in;    /* 不可超过 0.08in */
}
```

---

## 6. 兼容性规则

### WebKit（Safari / iOS）

- `.column` 必须设置 `min-height: 0`
- `.column-inner` 作为 flex 容器必须包裹在 `.column`（grid item）内部，不能直接让 grid item 变为 flex
- Grid track 高度必须用 `minmax(0, 1fr)` 替代固定值

---

## 7. 暗色模式

### 7.1 启用方式

Tailwind v4 `@custom-variant dark (&:where(.dark, .dark *))`。

### 7.2 切换机制

JS 切换 `html` 上的 `.dark` class。ThemeToggle 组件：

```astro
<!-- ThemeToggle.astro -->
<button id="theme-toggle" data-action="theme-toggle" ...>
  <Icon name="lucide:sun" class="w-4 h-4 hidden dark:block" />   <!-- 亮色模式显示太阳 -->
  <Icon name="lucide:moon" class="w-4 h-4 block dark:hidden" />    <!-- 暗色模式显示月亮 -->
</button>
```

Theme 脚本在 `Layout.astro` 的 `is:inline` 脚本中初始化，监听 `astro:page-load` 和 `astro:after-swap`。

### 7.3 颜色规范

| Token | Light | Dark |
|-------|-------|------|
| 背景 | `#ffffff` / `gray-50` | `#1f2937` / `gray-800` |
| 文字 | `gray-700` | `gray-200` |
| 强调/按钮 | `gray-800` | `gray-200` |
| 边框 | `gray-300` | `gray-600` |
| 链接 | `blue-600` | `blue-400` |

### 7.4 已知问题

- 深色模式下按钮文字使用 `gray-900`，确保与浅色背景对比度足够。

---

## 8. i18n 内容对等

### 8.1 数据源

文案通过 `t(lang, key)` 函数从 `src/content/homepage/{en,zh}.json` 读取。

### 8.2 规则

- **key 集合必须完全一致**：`en.json` 和 `zh.json` 的顶级键必须相同。
- 翻译缺失时禁止 fallback 到硬编码文本，必须补充翻译 key。
- 新增 key 时双语言 JSON 同时添加。

### 8.3 验证命令

```bash
diff <(node -e "console.log(Object.keys(require('./src/content/homepage/en.json')).sort().join('\n'))") \
     <(node -e "console.log(Object.keys(require('./src/content/homepage/zh.json')).sort().join('\n'))")
```

### 8.4 页面路由

| 路由 | 语言 |
|------|------|
| `/en/` | English |
| `/zh/` | 中文 |
| `/en/poster/` | English poster |
| `/zh/poster/` | 中文 poster |
| `/en/slides/` | English slides |
| `/zh/slides/` | 中文 slides |

---

## 9. 组件清单（完整）

| 组件 | 文件 | 说明 |
|------|------|------|
| HomePage | `src/components/HomePage.astro` | 首页内容（标题/作者/摘要/BibTeX/外部链接） |
| Poster | `src/components/Poster.astro` | 海报页面主体（4列网格布局） |
| Section | `src/components/Section.astro` | 内容区块（标题 + 内容） |
| ActionButton | `src/components/ActionButton.astro` | 操作按钮（Copy、Download） |
| CopyButton | `src/components/CopyButton.astro` | BibTeX 复制按钮 |
| Footer | `src/components/Footer.astro` | 页脚（CC BY-SA 4.0、Nerfies） |
| LangSwitcher | `src/components/LangSwitcher.astro` | 中英文切换，使用 `getRelativeLocaleUrl` |
| ThemeToggle | `src/components/ThemeToggle.astro` | 暗黑模式切换（太阳/月亮图标） |

---

## 10. Do / Don't

| ✅ 可以 | ❌ 禁止 |
|--------|---------|
| 修改 poster 布局前验证 4 列 `scrollHeight === clientHeight` | 随意修改 Content 区域高度（33in 硬约束） |
| 修改前检查 `npm run build` | 增大字号超过规范值 |
| 新增 key 时同步 en/zh JSON | 添加硬编码双语文本（必须用 `t()`） |
| 使用 `data-action="theme-toggle"` 事件委托 | 直接 `onclick` 绑定 ThemeToggle |
| 使用 `getRelativeLocaleUrl` 构建 i18n URL | 字符串拼接 locale URL |
| KaTeX CDN 使用固定版本 `@0.16.47` | 使用 latest 标签（可能破坏样式） |

---

## 11. 变更历史

| 日期 | 变更 |
|------|------|
| 2026-07-19 | 对齐代码现状：§1/§2 尺寸（7.4/33/1.6in）、§3 字号（公式 36pt、Footer 38/26/24pt）、§5.2 figure max-height 实际上限（8/8.5/7/6in）、§5.4 gap 0.15in、§5.5 公式 36pt、§12 checklist、§14.1 slides-raw 架构（ADR 0006） |
| 2026-06-17 | 新增 §14 Slides 设计规范（架构 / scaling / title 位置 / divider gutter / 字号 / height: 100% 教训） |
| 2026-05-27 | 新增 §7 暗色模式规范、§8 i18n 对等规则、§9 完整组件清单、§10 Do/Don't 规则 |

---

## 12. 修改 checklist

任何涉及 poster 布局的修改，发布前必须验证：

1. [ ] `npm run build` 通过（0 errors）
2. [ ] 4 列 `scrollHeight === clientHeight`
3. [ ] figure img 渲染高度 ≤ 对应 `max-height` 上限（默认 8in / flush 7in / flush img--95 8.5in / table-wrap 6in）
4. [ ] WebKit 截图无溢出

---

## 13. PDF 导出方案

### 13.1 方案：`window.print()` + `@media print`

海报页预览控制栏的"Print PDF"和"Download PDF"按钮均调用浏览器原生 `window.print()`，依赖 `@media print` CSS 渲染。

### 13.2 为什么不生成独立 PDF 文件

- 不暴露独立 PDF 文件 URL，所有交互都发生在海报页内部
- 无需 Playwright / Puppeteer 等构建时依赖，CI 更快、依赖更少
- `@media print` CSS 已在 `[lang]/poster.astro` 的 `is:global` 块中配置 `@page { size: 84in 42in; margin: 0 }`，确保打印尺寸正确

---

## 14. Slides 设计规范

> 本文描述 `/[lang]/slides/` 页面的所有布局约束。任何 slide 布局 / CSS 修改必须遵守本规范。

### 14.1 架构

| 维度 | 值 |
|------|-----|
| slide 设计尺寸 | 1920 × 1080 px（16:9） |
| 嵌入方式 | `<iframe src="/osa/slides-raw">` 加载 `src/slides.src` 的渲染产物（ADR 0006 后裸内容在 `/slides-raw/`，`/slides/` 是 meta-refresh redirector） |
| 真实 build source | `src/slides.src`（`src/integrations/build-slides-html.mjs` 的 `astro:config:setup` hook 渲染到 `public/slides-raw/index.html`） |
| 孤儿模板 | `scripts/templates/slides.html` 曾是从主站拷贝的死代码，**已删除**（2026-07-19 确认 `scripts/templates/` 不存在）；build 只读 `src/slides.src` |

### 14.2 Scaling — `updateScales()` 必须用 vh 约束

```js
const scale = Math.min(1, vw / 1920, vh / 1080);
```

- 早期版本只算 `vw / 1920`，导致 viewport 高度 < 1080 时 slide 顶部被截断（slide 2 在 1366×700 出现明显截断）。
- **硬规则**：任何 scale 公式必须同时考虑 `vw / 1920` 和 `vh / 1080`，取 `Math.min`。

### 14.3 标题 h1 位置 — 统一相对 slide (relX=150, relY=76)

所有 `.method-title-group`（slide 3-11 共 9 个）必须用以下 absolute 定位锚到 `.slide`：

```css
.method-header {
    padding: 0;
    position: static;  /* override .slide-header { position: relative } */
    min-height: 170px; /* 撑出空间，避免 body 撞标题 */
}
.method-header .method-title-group {
    position: absolute;
    top: 76px;
    left: 150px;
    right: 0;
}
```

**为什么需要 `position: static` on `.method-header`**：默认 `.slide-header` 有 `position: relative`，会让 `.method-title-group` 的 absolute 锚到 `.method-header`（不是 `.slide`），导致各 slide 起始 y 漂移（76 → -225）。改 static 后 absolute 跳过 `.method-header` 锚到 `.slide`（`position: relative`）。

**为什么需要 `min-height: 170px`**：`.method-title-group` 改 absolute 后不占 flow 空间，body 会撞标题。`min-height: 170px` (= 76 top + 65 h1 height + 12 margin + 2.5 divider + 14 buffer) 撑出空间。

### 14.4 `method-divider` logo gutter — 360px

```css
.method-divider {
    width: calc(100% - 360px);
    /* 100 (SZU logo) + 24 (gap) + 100 (PolyU logo) + 12 (buffer) + 124 (right margin) = 360 */
}
```

- 早期用 260px，**远端 Playwright probe 实测** 100% overlap（1920×1080 重叠 39px，1366×700 重叠 25px）。
- **硬规则**：360px 是经验值，所有 viewport 下（1920×1080 / 1366×700 / 1280×800）probe 验证 overlap=false。

### 14.5 字号 — h1 统一 54px

| 元素 | 字号 | 备注 |
|------|------|------|
| `.method-title-group h1` | **54px** | slide 3-11 全部统一，default `.slide-header h1, .method-title-group h1 { font-size: 54px }` |
| `.title-banner` h1 | 60px | slide 1（title）独立 |
| `.thanks-banner` h1 | 135px | slide 12（thanks）独立 |

**禁用**：不要对单个 slide 的 `.slide-header h1` 显式覆盖 `font-size`（如早期 `.slide-limitation .slide-header h1 { font-size: 44px }`），会破坏跨 slide 视觉一致性。

### 14.6 不要给 `.slide-XXX` 加 `height: 100%`

```css
/* ❌ 反例 — 会导致 scale² 缩小 */
.slide-contents { height: 100%; }

/* ✅ 正确 — 让 .slide 走 var(--slide-height)=1080 fixed */
.slide-contents { /* 什么都不加 */ }
```

**根因**（commit `f72145b` 修复）：`.slide-contents` 用了 `height: 100%`，让 .slide 高度 = 100% of parent (slide-wrapper = `1080 × scale`)。其他 slide 走 fixed `var(--slide-height)` = 1080。transform scale 后：

- 其他 slide 视觉 = `1080 × scale`（一次缩放，1366×700 = 700 ✓）
- slide 2 视觉 = `(1080 × scale) × scale` = `1080 × scale²`（**两次缩放**，1366×700 = **453** ✗，247px 黑边）

**硬规则**：所有 `.slide-XXX` 都不加 `height: 100%`，让 .slide 走 default 1080 fixed。

### 14.7 slide 12 (Thanks) 底部 Paper/Code 链接 = **设计意图已移除**

- `src/slides.src:1811` 显式注释 `<!-- Paper & Code links removed -->`。
- CSS `.thanks-footer` (line 1287-1308) 现为 **dead code**。
- 用户决策（2026-06-17）：保持当前状态，不恢复链接。
- 死代码保留（不删）：避免破坏历史 commit 的 CSS history，方便以后恢复。

### 14.8 校徽 (`header-logos`)

```css
.header-logos {
    position: absolute;
    top: 38px;
    right: 75px;
    z-index: 10;
}
.logo-szu-img, .logo-polyu-img {
    width: 100px;
    height: 100px;
    object-fit: contain;
}
```

- 2 个 logo 横向排列，gap 24px，总宽 224px。
- 绝对定位在 slide 右上角，**不会**因为 transform scale 改变位置。

### 14.9 视觉验证协议

任何 slide CSS 改动后，**必须**用 Playwright + minimax image understanding 双验证：

```js
// probe divider vs logos overlap
for (const ds of [3,4,7,8,9,10,11]) {
  const db = await div.boundingBox();
  const lb = await logos.boundingBox();
  console.log(`slide ${ds}: div [${db.x}..${db.x+db.width}] logos [${lb.x}..${lb.x+lb.width}] overlap=${db.x+db.width > lb.x}`);
}
```

```js
// probe h1 位置统一
for (const ds of [3,4,7,8,9,10,11]) {
  const fs = await h1.evaluate(el => getComputedStyle(el).fontSize);
  console.log(`slide ${ds} h1 font-size: ${fs}`);  // 必须都是 54px
}
```

### 14.10 Do / Don't

| ✅ 可以 | ❌ 禁止 |
|--------|---------|
| 改 `src/slides.src`（build 真正读的 source） | 复活 `scripts/templates/slides.html`（历史孤儿，已删除，build 不读） |
| 用 `Math.min(1, vw/1920, vh/1080)` 算 scale | 漏 `vh / 1080`（slide 2 截断 bug 复发） |
| 标题用 `top: 76; left: 150; right: 0` 锚 `.slide` | 用 `margin-top: -Xpx` 算 pixel 偏移（X 算不准） |
| `.method-divider` 用 `calc(100% - 360px)` | 用 `260px` 或更小（overlap 100%） |
| `.method-header { min-height: 170px }` | 不加 min-height（body 撞 absolute 标题） |
| `.method-header { position: static }` | 漏 `position: static`（absolute 锚错到 .method-header） |
| `.slide-XXX` 不加 `height: 100%` | 加 `height: 100%`（scale² 缩小，黑边） |
| h1 走 default 54px | 单 slide 显式覆盖 h1 字号（破坏一致性） |
| 改完硬刷新浏览器 (Cmd+Shift+R) | 信任 soft refresh（CDN/browser cache 假象） |
| Playwright probe + minimax 视觉双验证 | 只看 build / dist（build-pass theater） |

### 14.11 变更历史

| 日期 | 变更 |
|------|------|
| 2026-06-17 | 新增 §14 Slides 设计规范（含 14.1-14.10） |
| 2026-06-17 | 修复 §14.2：scale 必须用 vh 约束（commit `cc3f78a`） |
| 2026-06-17 | 修复 §14.4：divider gutter 260→360px（commit `30b69b0`） |
| 2026-06-17 | 修复 §14.5：slide 11 h1 44→54px 统一（commit `5a10e7b`） |
| 2026-06-17 | 修复 §14.6：删 `.slide-contents { height: 100% }`（commit `f72145b`） |

