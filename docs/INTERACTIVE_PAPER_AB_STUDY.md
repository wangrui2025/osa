# OSA Interactive Paper — A/B 读者研究与科学边界（2026-11-07）

## 目标和两版可比性

在保留 [原始 OSA 论文网站](https://wangrui2025.github.io/osa/en/) 的前提下，让非 Agent/非线性代数背景的读者理解 OSA 的科学机制，同时通过真实网页选择更好的讲解方式。

- [比较入口 EN](https://wangrui2025.github.io/osa/en/explore/) · [中文](https://wangrui2025.github.io/osa/zh/explore/)。
- [A：Motion first](https://wangrui2025.github.io/osa/en/explore/video-first/) · **先看合成心超运动示意**，再逐个探索模块。
- [B：Network first](https://wangrui2025.github.io/osa/en/explore/network-first/) · **先看完整的信息流及上一时刻状态反馈回路**，再观察同一运动示意。
- A/B 共用 *同一个* `StudyLab.astro`、`study-lab.ts` 和原 `MethodExplorer.astro`，保证 APFE、OSU、数字与警示相同；仅 CSS 网格/主视觉层次不同。

两版均包含：带帧控制的合成运动场、可点击的 ResNet-50/APFE/OSU/decoder 数据流、二维单位向量几何实验、奇异值/条件数的 ELI5 可展开解释、原有 APFE/OSU 数学交互、正式论文结构图与原文链接。交互有键盘输入、reduced-motion 和移动端布局。测试脚本：`e2e/study-lab.spec.ts`。

## 真实证据 vs 讲解示意

| 对象 | 身份 | 可证实的含义 | 绝不能冒充 |
| --- | --- | --- | --- |
| 动态心超风格扇形 + 描边 | 代码生成的合成几何/散斑纹理 | “左心室轮廓随帧改变”这一视觉直觉 | 患者视频、EchoNet-Dynamic 训练样本、OSA 真实预测、医学标注 |
| ResNet → APFE → OSU → Decoder | 论文结构的**高度简化教学总览** | 数据流顺序、OSU 时序状态反馈 | 论文完整计算图/每层神经网络真值 |
| 2×2 向量与 σ₂、κ | 单位列组成矩阵的精确玩具计算 | 两列趋同导致最小奇异值趋零、条件数增大 | 真实 OSU 模型的训练/推理测量、证明 OSA 实际无任何数值误差 |
| 独立 APFE / OSU 实验 | 公式驱动的合成特征和理想二维投影 | 残差概念、正交化的直觉 | 完美分离医学解剖结构、论文有限步 Newton–Schulz 的实际残差 |

原论文实际 OSU 使用有限步 Newton–Schulz 的近似投影，APFE 包含卷积分支与自适应门控；不能从示意图推导临床准确率，严谨结果以 [CVF 论文](https://openaccess.thecvf.com/content/CVPR2026/html/Wang_OSA_Echocardiography_Video_Segmentation_via_Orthogonalized_State_Update_and_Anatomical_CVPR_2026_paper.html) 和原始实验为准。由于 EchoNet-Dynamic 等真实患者数据有再分发/使用边界，未擅自复制临床视频到公共网页。

## 已调查的成熟方案与采用决定

| 候选 | 我们借鉴的机制 | 本次不直接照搬的原因 |
| --- | --- | --- |
| [Polo Club Transformer Explainer](https://github.com/poloclub/transformer-explainer) | 模块级信息流、选择模块保持上下文 | 其示例模型与 ONNX 浏览器推理体系和 OSA 不同；没有必要整套重写 |
| [Polo Club Diffusion Explainer](https://poloclub.github.io/diffusion-explainer/) | 把输入、时间演化、内部变换连成故事 | 项目特定的数据/模型与 OSA 不同 |
| [Distill](https://distill.pub/) | 先观察现象，再引出数学机制 | 原作品是表达范例，不是可以一键迁移的 OSA 代码 |
| [Setosa Explained Visually](https://setosa.io/ev/) | 操作数学变量立刻得到反应 | 需要按 OSA 的真实概念重建对应的数学对象 |
| [Moonshine](https://github.com/enjalot/moonshine)、[Living Papers](https://idl.uw.edu/papers/living-papers)、[PaperLab](https://github.com/Jeba-Jebarsan/PaperLab) | 作者工具、交互论文规范、AI 辅导体验 | 可作为下一轮编写系统备选；本次优先复用现有 Astro 和零新增依赖 |

选择 **re-use + thin integration**：保留已有 Astro、i18n、MethodExplorer 及部署检查；只为新的科学读者流程补必要交互，避免从零实现另一套可视化框架。

## 读者验收（选择哪一版之前）

技术检查（自动化）：`npm ci`、`npm run build`、`npx playwright test`、`npm audit --omit=dev --audit-level=high --registry=https://registry.npmjs.org`，涵盖中文、英语、440px 窄屏、时间滑块、模块检查、10°/90° 计算、无障碍减少动效、比较页链接。

人的理解检查（**尚未执行，禁止冒充通过**）：给不了解矩阵知识的独立读者，观察是否能在不看数学术语的情况下回答三个任务：一是 APFE 在处理怎样的空间线索；二是 OSU 的过去状态如何影响当前帧；三是箭头方向重合时奇异值/条件数发生什么变化且为什么。记录完成与卡住位置、错误解释和耗时；不强迫做选择题，用户仍可写自由反馈。

## 用户偏好比对与记录

- 2026-11-07 本轮首轮明确偏好：组合 Polo Club 的网络探索、Distill 的叙事、Setosa 的可操作数学；必须为初学者解释最小奇异值与条件数，A/B 均实际可访问并保持科学内容一致。
- 当前 A/B **尚未选出获胜者**。通过截图/自动化检查只能证明页面可用，不代表真实用户理解更好。
- 对比页反馈表 **只在本地浏览器复制**，不自动上传任何意见，也不建立带有个人信息的公开数据库。把复制的反馈粘贴到现有对话后，按实际来源、日期、版本、新旧比较记录到受控私有偏好库；只在已获授权的工具/会话内行动。
- 原始对话与账户级偏好保存 owner 是私有 `mykcs/.agents/docs/learning`；本公开 OSA 仓库只保存产品内容、科学边界、测试和非私人设计记录。未来谈话无法自动保证被收集，应以可访问来源增量核实并保留缺口。

## UI/工程复用边界

`StudyLab.astro` 是 A/B 的唯一视觉结构；`study-lab.ts` 实现精确的二维例子及合成帧，`study-lab.css` 区分 A 与 B；`StudyComparison.astro` 是对比选择和本地复制。中文/英文采用同一 key 集合。实验路由标记 `noindex`，避免搜索引擎把未定的 A/B 候选当作正式科学结论；生产主页仍是原论文入口。

**后续选型规则：** 用户真实体验后，以“喜欢/不喜欢什么、是否看懂、为什么、哪种设备”更新基线；若 A/B 都不满意，组合具体优点做 C 而不是虚报现有 A/B 成功。正式上线主要视图之前先确认科学边界、可用性、移动端、实际 reader evidence。
