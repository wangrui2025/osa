# OSA 全站排版与年月日交付合同

2026年11月20日维护者要求本站全部网页真正消费统一字号、字体、字重、行距、间距、宽度和年月日规则；跨网站保留独立风格。

## 标准与 source owner

- `src/styles/tokens.css`：全站语义排版、间距、宽度与海报/幻灯片物理变体；`global.css` 把 Tailwind 工具类接到 owner。
- `public/404.html` 保持自包含静态路径，其生成样式区域自动从 owner 同步；`src/slides.src` 经唯一构建器生成 raw slides并嵌入同一 owner。
- `date-format.mjs` / `DateText.astro`：日历型显示、严格有效性校验、中文年月日/英文YMD、保持年月或年份原有精度。源数据、BibTeX、metadata不改写。
- [站内标准与验收](../site-standards.md) 是详细调用规则、路由清单和验证入口；`DESIGN.md` 保留84×42in四列海报、1920×1080幻灯片和产品决策。

## 必须达到的交付标准

1. 全部实际HTML动态枚举，当前18份；页面含普通双语、实验页、语言404、独立404、两个redirect fallback及raw slides，加载链与真实body消费均可检查。新增漏接页面失败。
2. 字体、字号、字重、行距与字距只在owner定义；普通margin/padding/gap/文字宽度引用同一节奏。海报pt/in与演示px是有边界的角色，普通控制栏仍使用屏幕标准。
3. 日期为中文YYYY年M月D日/英文YYYY-MM-DD；不补造缺少的日；无时区转换造成跨日；代码、URL、原始引用和metadata保持。
4. 两浏览器全部路由1280×956/440×956、适用主题、真实跳转与打开状态验证；可见文字字号/字体/行距符合角色，无未解释溢出/裁切。真实token扰动必须改变使用元素并恢复，宽度须改变实际矩形。
5. 四列海报保持物理尺寸、无溢出和完整footer；必要打印PDF与12张幻灯片单次缩放/标题锚点/校徽边界通过。现有交互测试与用户已决定隐去的实验入口、Thanks链接保持。
6. `npm ci`、日期/guard单测、`npm run build`、Chromium/WebKit Playwright、截图审查和现有必要检查通过；手动dispatch绑定完整SHA，不把生产烟测当分支全路由验收。
7. root验收并更新PR证据，合并main，读回merge SHA及GitHub Pages `/osa/` 部署身份后才完成。

## 当前执行记录

本文件不写易过时的CI状态收据。当前候选、必要检查、合并及部署的事实见 [PR #19](https://github.com/wangrui2025/osa/pull/19) 和 [Actions](https://github.com/wangrui2025/osa/actions/workflows/astro.yml)。回退使用本PR逆向变更。
