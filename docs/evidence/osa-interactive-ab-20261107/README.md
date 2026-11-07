# OSA 交互论文 A/B — 浏览器渲染快照

2026-11-07，从本地 Astro 静态构建的真实 Chromium 浏览器截取。图像只用于审阅 A/B 呈现方式；截图内容中的心超风格扇形和轮廓为纯代码生成的合成教学示意，**不是患者视频或模型的实际分割**。

| 条件 | 浏览器截图 | 说明 |
| --- | --- | --- |
| A / desktop 1440 px | [A-desktop.webp](A-desktop.webp) | 合成视频视觉优先，与网络总览并列 |
| B / desktop 1440 px | [B-desktop.webp](B-desktop.webp) | 网络总览优先，下方视频与说明面板 |
| A / mobile 440 px | [A-mobile.webp](A-mobile.webp) | 先视频后网络，适配窄屏 |
| B / mobile 440 px | [B-mobile.webp](B-mobile.webp) | 先网络后视频，适配窄屏 |
| Comparison / desktop | [compare.webp](compare.webp) | 两版入口和选择板 |

实现：`src/components/StudyLab.astro`、`StudyComparison.astro`、`src/scripts/study-lab.ts`、`src/styles/study-lab.css`。两版共享数学逻辑和科学限制说明，中英翻译对齐。

验收方法：`npm run build`；`npx playwright test`（全套 17 项自动浏览器测试，截图产生时额外执行 1 项临时截图测试）；`npm --registry=https://registry.npmjs.org audit --omit=dev --audit-level=high`。审计高危和严重项 0，一项低危 KaTeX 提示仍需单独评估（未关闭审计门）。

这证明交互正常渲染，**不等于**真实读者已看懂或作者科学审稿已确认。A/B 结果在收到真实反馈前保持“未决”。
