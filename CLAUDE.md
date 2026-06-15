# OSA — Astro 项目

> 技术栈：Astro v6.4.2 + Tailwind + TypeScript
> 部署路径：`https://wangrui2025.github.io/osa/`

## 请参考

请先阅读 `~/.claude/CLAUDE.md` 获得通用知识。

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
