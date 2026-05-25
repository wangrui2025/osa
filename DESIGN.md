# OSA Poster 排版设计规范

> 本文档描述 OSA 学术海报的排版约束与设计原则。
> 任何修改必须遵守本规范，否则可能导致内容溢出或布局崩坏。

---

## 1. 物理尺寸

| 属性 | 值 |
|------|-----|
| 总尺寸 | 84in × 42in |
| Header 高度 | 8in |
| Content 高度 | 32in（**硬约束，不可突破**） |
| Footer 高度 | 2in |
| 列数 | 4 列等宽 |

---

## 2. 布局结构

```
+----------------------------------------------------------+
|                        Header (8in)                       |
+----------------------------------------------------------+
| Col 1  |  Col 2  |  Col 3  |  Col 4  |   Content (32in)  |
|        |         |         |         |                   |
| 问题    |  方法   |  OSU   |  实验   |                   |
| 设定    |  概览   |  APFE  |  结果   |                   |
|        |         |         |         |                   |
+----------------------------------------------------------+
|                        Footer (2in)                       |
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
| 公式 | 28pt |
| Footer 标题 | 44pt |
| Footer 链接 | 37pt |

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

- **Content 区域高度 = 32in**。任何增加内容高度的改动（增大字号、增加 padding、增加 gap）必须通过压缩其他区域来补偿。
- 每列 `scrollHeight` 必须等于 `clientHeight`（无溢出）。

### 5.2 图片约束

```css
.figure img {
  max-height: 6in;    /* 硬约束：防止图片无限放大挤占空间 */
}
```

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
  gap: 0.25in;        /* 不可超过 0.3in，否则总高度会超 */
}
```

### 5.5 公式块约束

```css
.formula-box {
  font-size: 28pt;    /* 不可超过 30pt */
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

## 7. 修改 checklist

任何涉及 poster 布局的修改，发布前必须验证：

1. [ ] `npm run build` 通过（0 errors）
2. [ ] 4 列 `scrollHeight === clientHeight`
3. [ ] `maxFigureHeight <= 576px`（6in）
4. [ ] WebKit 截图无溢出

---

## 8. PDF 导出方案决策

### 8.1 方案：Playwright 构建时生成

```
astro build ──→ dist/en/poster/index.html ──→ node scripts/generate-poster-pdf.mjs ──→ dist/osa-poster.pdf
```

海报页预览控制栏提供"Download PDF"下载链接，指向该构建产物。

### 8.2 为什么不用纯 CSS `@page` 打印

浏览器打印引擎对大幅面（84in × 42in）支持不稳定：

- Chrome `@page { size: 84in 42in; margin: 0; }` 在 scoped `<style>` 中可能被 Astro 忽略（需要 `is:global`）
- 即使正确设置，Chrome 打印对话框仍然可能渲染自带页眉/页脚（日期、URL、页码），无法通过 CSS 完全禁用
- 用户每次需要手动取消勾选"更多设置 → 页眉和页脚"，体验不可控

保留 `@media print` CSS 作为 fallback，但主方案使用 Playwright。

### 8.3 为什么不用服务端 Puppeteer

站点托管在 GitHub Pages，没有 Node 运行时。Puppeteer 已被社区大规模弃用，Playwright 是当前标准。

### 8.4 关键参数

```js
await page.pdf({
  path: join(dist, 'osa-poster.pdf'),
  width: '84in',
  height: '42in',
  printBackground: true,
});
```

- 不设置 `scale`：Playwright `page.pdf()` 传入 `width/height` 时自动按指定尺寸渲染
- 不设置 `preferCSSPageSize`：显式尺寸优先于 CSS `@page`
- `waitUntil: 'networkidle'`：确保所有图片和资源加载完成

### 8.5 CI 中的 Playwright

CI workflow 已添加：
- Playwright browsers 缓存（`~/.cache/ms-playwright`）
- `npx playwright install chromium --with-deps`
- `build` 脚本自动串联 PDF 生成

首次 CI 运行耗时约 +60s（下载 Chromium 150MB），后续命中缓存约 +5s。

### 8.6 CSS 打印 fallback

`@media print` CSS 保留作为浏览器直接打印的 fallback。用户仍可通过海报页的 "Print PDF" 按钮调用 `window.print()`，此时依赖 `@media print` 渲染。
