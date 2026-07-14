# OSA — Astro 项目

> 技术栈：Astro v6.4.2 + Tailwind + TypeScript
> 部署路径：`https://wangrui2025.github.io/osa/`

## 请参考

请先阅读 `~/.claude/CLAUDE.md` 获得通用知识。

**N-tool 网络搜索**: 任何 web 搜索 / 信息查证必跑 [N-tool-search SSOT](https://example.invalid/~/.claude/rules/protocols/N-tool-search.md) v1.1.2 (N 当前 = 6: MiniMax + kimi-webbridge + anysearch + WebFetch + exa + mmx 并行). 旧 "5-tool" / "5-tool fan-out" 全部走 N-tool.

## 项目概述

OSA 论文项目页面，展示论文的标题、作者、摘要、方法图、实验结果、BibTeX 等信息。

## 快速验证

```bash
npm run build    # 必须成功
```

## 项目结构

- `src/pages/` — 页面路由
- `src/components/` — UI 组件
- `src/content/homepage/` — i18n 文案（en.json, zh.json）
- `src/i18n/index.ts` — 翻译函数 `t(lang, key)`
- `src/layouts/` — 布局组件

## i18n 架构

使用 Content Collections 作为 i18n 数据源，Zod schema 验证结构，`t()` 函数查询翻译。

## Build

```bash
npm install
npm run dev
npm run build
```

## Slides Architecture — Read Before Editing

OSA slides 通过 `<iframe src="/osa/slides">` 嵌入。**唯一的 build source 是 `src/slides.src`**：

| 路径 | 角色 | Build 是否读它 |
|------|------|---------------|
| `src/slides.src` | **真正的 build source** | ✅ `src/integrations/build-slides-html.mjs` 的 `astro:config:setup` hook 读这个，渲染后输出 `public/slides/index.html` |
| `public/slides/index.html` | Build 输出 | 🔒 自动生成，`astro:config:setup` 时覆盖，不要手改 |

### Workflow — Change Slides Content

```bash
# 改 src/slides.src (NOT public/slides/index.html)
$EDITOR src/slides.src

# 验证 build
npm run build

# 提交 + 推送
~/.claude/scripts/smart-push.sh ~/Repo/webs/active/OSA "fix(slides): ..." done
```

**Warning**：
1. 改 `public/slides/index.html` 不会持久——下次 `npm run dev` / `npm run build` 会被 `build-slides-html` 覆盖。
2. CSS 改完后浏览器需**硬刷新 (Cmd+Shift+R / Ctrl+Shift+R)** 才能看到效果。

## /slides-raw/ — 故意仅 en (2026-06-24)

`public/slides-raw/index.html` 是 iframe 嵌入的技术性 slide 产物，由 `src/slides.src` build-time 生成，**故意保持 en-only**：

- **不**走 i18n 系统（src/content/homepage/{en,zh}.json）—— 内容是 paper slide 演示稿，本身就是英文 CVPR 报告
- **`lang="en"`** 故意保留（不是 zh 错配）
- iframe 父页面（`/en/slides/` + `/zh/slides/`）做 i18n 包装层，slide 本身是底层资产

**禁止**：将 slides-raw 改造成 zh 翻译版。**禁止**移除 `lang="en"`。

## 404.html — 静态 fallback (2026-06-24)

`public/404.html` 是 GH Pages 在 dynamic route 解析前的静态 fallback，必须保留：

- 路径：`public/404.html`（**不要**改为 `src/pages/...`，会与 `[lang]/404.astro` 冲突）
- 内容：自包含 HTML（GH Pages 静态服务，**不**走 Astro 渲染管线）
- i18n fallback：en 内容 + 指向 `/osa/zh/` 的链接（dynamic `/zh/404/` 解析失败时仍能 fallback）
- 同步在 src/pages/[lang]/404.astro 保持动态版（en + zh 完整版）

