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
| 修改 poster 布局前验证 4 列 `scrollHeight === clientHeight` | 随意修改 Content 区域高度（32in 硬约束） |
| 修改前检查 `npm run build` | 增大字号超过规范值 |
| 新增 key 时同步 en/zh JSON | 添加硬编码双语文本（必须用 `t()`） |
| 使用 `data-action="theme-toggle"` 事件委托 | 直接 `onclick` 绑定 ThemeToggle |
| 使用 `getRelativeLocaleUrl` 构建 i18n URL | 字符串拼接 locale URL |
| KaTeX CDN 使用固定版本 `@0.16.47` | 使用 latest 标签（可能破坏样式） |

---

## 11. 变更历史

| 日期 | 变更 |
|------|------|
| 2026-05-27 | 新增 §7 暗色模式规范、§8 i18n 对等规则、§9 完整组件清单、§10 Do/Don't 规则 |

---

## 12. 修改 checklist

任何涉及 poster 布局的修改，发布前必须验证：

1. [ ] `npm run build` 通过（0 errors）
2. [ ] 4 列 `scrollHeight === clientHeight`
3. [ ] `maxFigureHeight <= 576px`（6in）
4. [ ] WebKit 截图无溢出

---

## 13. PDF 导出方案

### 13.1 方案：`window.print()` + `@media print`

海报页预览控制栏的"Print PDF"和"Download PDF"按钮均调用浏览器原生 `window.print()`，依赖 `@media print` CSS 渲染。

### 13.2 为什么不生成独立 PDF 文件

- 不暴露独立 PDF 文件 URL，所有交互都发生在海报页内部
- 无需 Playwright / Puppeteer 等构建时依赖，CI 更快、依赖更少
- `@media print` CSS 已在 `[lang]/poster.astro` 的 `is:global` 块中配置 `@page { size: 84in 42in; margin: 0 }`，确保打印尺寸正确
