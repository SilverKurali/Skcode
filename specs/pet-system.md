# 2D 宠物（SilverKorali）Spec：会话区立绘 + 状态反应

## 背景与决策

用户希望主界面有一个 2D 二次元人物形象（自备立绘素材，人物名 **SilverKorali**），
Agent 工作时小人能做出交互反应：需要权限、遇到错误、等待用户回答、任务完成等。
素材仅有静态图片（三视图立绘，白底 JPEG，位于仓库外的 `2Dlive/` 目录），
没有动作素材；生图/生视频 API 仅用于素材制作，**不进入产品运行时**。

决策：

- 形象为**静态立绘 + CSS 动画**（浮动/摆动/弹跳/抖动），不引入 L2D/骨骼动画运行时；
  后续若拿到帧动画素材，只替换资产与动画层，状态推导不动。
- 入口挂载在**会话面板（SessionPane）内部右下角**，浮动于时间线上方，
  整体 `pointer-events-none`，绝不遮挡、不拦截聊天区交互（纯装饰层）。
- 设置 → 通用提供开关「2D 宠物显示」，默认开启；关闭后完全卸载渲染。
- 立绘抠图去底为透明 PNG，随包分发（`packages/ui/src/assets/pet/`）。

## 资产

| 文件                                             | 来源               | 用途                    |
| ------------------------------------------------ | ------------------ | ----------------------- |
| `silverkorali-idle.png`（正面立绘，520px 高）    | 2Dlive 正面图抠图  | 待机兜底/完成/错误/等待 |
| `silverkorali-working.png`（侧面立绘，520px 高） | 2Dlive 侧面图抠图  | 工作中兜底              |
| `silverkorali-idle-loop.webp`（动态 WebP alpha） | Agnes 视频参考生成 | 待机呼吸循环            |
| `silverkorali-work-loop.webp`（动态 WebP alpha） | Agnes 视频参考生成 | 工作打字循环            |

抠图管线（行背景渐变估计 + 边界连通 + 封闭口袋判定 + 边缘去污染）为一次性脚本，
不进仓库；素材更新时重跑即可。

**动作循环资产**（v3 引入，v5 起为动态 WebP）：立绘合成到纯绿幕 (#00FF00) 上传
临时图床，经 Agnes `agnes-video-2.5-flash` reference 模式生成 5s 竖屏动作视频，
ffmpeg `chromakey + despill` 抠像、按 alpha 包围盒裁切（高度 520、20fps），
逐帧 WebP + ANMF 容器封装成**动态 WebP（8-bit alpha）**。本地 ffmpeg 的 libvpx
封装不支持 alpha 编码（黑底 WebM 方案已废弃）；动态 WebP 由渲染层 `<img>` 播放。
生产属一次性素材制作，API key 与图床 URL 不进仓库、不出现在运行时。运行时规则：

- 所有情绪位优先播对应 `-loop.webp` 动效；用户包的 `.webm` 走 `<video>`。
- 动效加载失败或 `prefers-reduced-motion` 时回退静态 PNG + CSS 动画。
- CSS 微动作（点击反应/倾斜等）以 transform 叠加在 video 元素上，二者可组合。

## 状态所有者

- **mood 推导**（纯函数 `derivePetMood`）：输入 `snapshot.control.phase`、
  `snapshot.pendingInteractions`，输出 `idle | working | permission | question | error | done`。
  无本地状态、无写入路径；快照是唯一事实来源。
  - 优先级：`permission` > `question` > `error` > `working` > `done`（限时气泡）> `idle`。
  - `phase ∈ {prewarming, running}` → working；`phase === "error"` 或 `control.lastError` → error；
  - `pendingInteractions` 含 `kind: "permission"` → permission；含 `kind: "userInput"` → question。
- **显示开关**：renderer zustand `SkcodeState.petSystemEnabled`，
  localStorage key `skcode-pet-system`（与 performanceMode 同一模式）。
  不进广播 `BROADCAST_FIELDS`（每窗口独立显示即可，避免回环）。
- **完成气泡**：组件局部 state，进入 `done` 后 4s 自动回到 idle 气泡态。

## 事件顺序

```
snapshot 更新（subscription push）
  → derivePetMood(phase, pendingInteractions)
  → 立绘切换（idle ⇄ working）+ 气泡文案 + 动画 class
权限/提问弹窗解决（interaction 移除）→ mood 自动回落 working/idle
错误横幅被关闭 → mascot 不受影响（只读 control.lastError，dismiss 列表在 SessionPane 层）
```

## 接口

- `packages/ui/src/pet/SilverKoraliPet.tsx`：
  `props = { snapshot: ConversationSnapshot | null }`；内部读
  `useSkcodeStoreWithDefault(s => s.petSystemEnabled, false)` 决定是否渲染。
- `derivePetMood` 独立导出（供单测与未来桌面宠物位复用）。
- `packages/ui/src/pet/petActions.ts`：动作池与点击判定纯函数
  （`pickAction` / `resolvePetReaction`），动画本身在 CSS 层。
- 动画 keyframes 统一放 `packages/ui/src/styles.css`，前缀 `skcode-pet-`，
  全部带 `prefers-reduced-motion: reduce` 守护。

## 宠物化交互（v2）

立绘仍是静态图，"动作" = 命名 CSS 动画 + 调度器；会话快照仍是唯一事实来源：

- **空闲小动作**：仅 `idle` 情绪、页面可见、未开启减少动态效果时，
  每 8–18s 随机播放一个微动作（歪头/伸懒腰/跳一跳/扭一扭/点头），播完回待机浮动。
- **随机搭话**：空闲时每 25–50s 有机会冒一句随机气泡（休息、喝水类陪伴语），4s 后消失。
- **点击互动**：立绘本体是可点击按钮（容器仍 `pointer-events-none`，只有小人可点，
  不遮挡聊天区其余交互）：
  - 单次/少量点击：随机宠物反应（开心跳/双回弹/快速扭动）+ 头顶爱心粒子，
    30% 概率冒一句反应语；
  - 2.5s 内连点 ≥5 次：进入「晕头转向」动作并显示专属气泡（有冷却，不连续触发）。
- **优先级**：气泡为 情绪 > 互动语 > 搭话；动作为 点击反应 > 空闲小动作 > 情绪动画。
- 会话进入非 idle 情绪时调度器暂停；回到空闲自动恢复。

## 验收场景

1. 开关关闭：会话区无任何立绘与 DOM 残留；重启后保持关闭。
2. 空闲会话：正面立绘轻微浮动，无气泡。
3. 发送任务进入 running：切换为侧面立绘 + 摆动动画。
4. 触发工具权限：立绘弹跳 + 气泡「需要你确认权限」；批准后回到工作态。
5. AskUserQuestion 等待回答：气泡「在等你回答」+ 弹跳。
6. 会话出错：立绘抖动 + 气泡「出错了」。
7. 任务 completedSuccess：短暂显示「任务完成啦」气泡后回到待机。
8. 移动端窄容器（@container/conversation ≤ 640px）：立绘缩小，不遮挡输入区。
9. 系统 prefers-reduced-motion：所有动画关闭，仅静态显示；空闲动作与搭话调度器不启动。
10. 空闲 8–18s 后随机播放一个小动作并回待机；期间有任务开始则立即让位给工作态。
11. 点击小人：播放随机宠物反应 + 头顶冒爱心；工作/等待状态下点击仍可互动，但不清除情绪气泡。
12. 2.5s 内连点 ≥5 次：晕头转向动作 + 专属气泡，冷却期内继续点击不重复触发。

## 宠物包扩展系统（v4）

2D 宠物从"内置 SilverKorali 专属"升级为**可扩展的宠物包（pet pack）体系**：
用户可以在 Skcode 里自行创建（或与 AI 一起创建）自己的宠物，也可以继续用内置的 SilverKorali。

### 包格式

每个包是一个目录：`~/.skcode/v2/pets/<packId>/`

```
pet.json      # 清单（zod 校验）
idle.png            # 待机立绘（必填；透明底 PNG）
working.png         # 工作立绘（可选）
idle.webm           # 待机动作视频（可选，VP9 alpha；有则优先于图）
working.webm        # 工作动作视频（可选）
```

清单字段：`id`（slug）、`name`、`author?`、`description?`、`version?`、
`idleImage`、`workingImage?`、`idleVideo?`、`workingVideo?`、
`chatterLines?: string[]`（随机搭话）、`petLines?: string[]`（被摸反应语）、
`dizzyLine?: string`（连点晕眩语）。包内文案为字面量，不走 i18n。

### 状态所有者

- **激活包 id**：renderer zustand `petPackId`（localStorage
  `skcode-pet-pack`，默认 `silverkorali`），与显示开关同一模式。
- **内置包**：`silverkorali` 永远可用（资产随包分发，不走文件 IO），行为与 v2/v3 一致。
- **用户包**：main 进程扫描 `~/.skcode/v2/pets/`，manifest `safeParse` 失败的目录
  跳过并 warn；资产经 IPC 以 base64 data URL 提供给 renderer（mascot 资产均为小文件）。
  路径安全：资产文件名白名单 `[\w.-]+`，解析后必须落在包目录内。
- **web 端**：平台方法返回空列表，仅内置包可用。

### 接口

- `packages/shared/src/petPack.ts`：manifest schema + `PetPackSummary` 类型。
- `PlatformChannels.PetListPacks / PetReadAsset` + payload 映射 +
  `IPlatformService.listPetPacks() / readPetAsset(packId, file)`；
  desktop 经 preload 桥接，main 侧 `desktopPetPacks.ts` 实现；web 桩返回空。
- 设置 → 通用「2D 宠物显示」旁增加**包选择器**（内置 + 用户包）、「重新扫描」、
  「用 AI 创建宠物」按钮：后者经既有 `onCreateTask({ initialPrompt })` 链路
  （Root → SettingsPage → GeneralSectionContent）发起一个预填脚手架提示词的草稿任务，
  提示词内嵌清单模板，引导 Agent 在 `~/.skcode/v2/pets/<id>/` 生成包文件；
  完成后在设置里点「重新扫描」即可选用。

## 阳光少女性格与全情绪动画（v5）

人设定位：**阳光开朗、活泼可爱的元气少女**——台词带语气词/颜文字、动作弹跳有活力、
被摸会笑、久等会犯困。内置 SilverKorali 全部情绪位升级为视频循环（stills 仅作
`prefers-reduced-motion` 与视频加载失败的兜底）。

### 情绪与资产

`PetMood` 扩展为 `idle | working | thinking | permission | question | error | done`，
另有两个**纯本地表现态**（不来自快照）：`greet`（会话面板挂载且 idle 时挥手一次）、
`sleepy`（空闲超 90s 且无互动时犯困，任意情绪变化或点击立即唤醒）。

| mood       | 快照来源             | 视频循环             | 静态兜底             |
| ---------- | -------------------- | -------------------- | -------------------- |
| idle       | 默认                 | idle-loop（v3）      | silverkorali-idle    |
| working    | `running`            | work-loop（v3）      | silverkorali-working |
| thinking   | `prewarming`         | thinking-loop（新）  | thinking.png（抽帧） |
| permission | pending `permission` | asking-loop（新）    | asking.png           |
| question   | pending `userInput`  | puzzled-loop（新）   | puzzled.png          |
| error      | `error`/`lastError`  | sad-loop（新）       | sad.png              |
| done       | `completedSuccess`   | celebrate-loop（新） | celebrate.png        |
| greet      | 本地（挂载一次性）   | greet-loop（新）     | greet.png            |
| sleepy     | 本地（空闲计时）     | sleepy-loop（新）    | sleepy.png           |

资产制作仍走 v3 绿幕管线（绿幕参考图 → Agnes reference 5s 9:16 → ffmpeg
chromakey+despill → 按 alpha 包围盒裁切 → 高度 520 VP9 alpha WebM；
stills 从成片抽帧 + 同管线抠像）。一次性脚本与 key 不进仓库。

### 台词（性格载体）

- 情绪气泡从**固定单条**改为**随机池**：`moodLines` 按情绪分组
  （working/permission/question/error/done/thinking），greet 另有 `greetLines`。
- 内置池走 i18n（`pet.line.*` 扩充到 12 条、`pet.petline.*` 8 条、dizzy 3 条、
  各情绪池 3–4 条），语气统一为元气少女：轻快、陪伴感、适度颜文字。
- 用户包通过 manifest 的 `moodLines`/`greetLines` 提供字面量池（与 v4 的
  chatterLines/petLines 并存，优先级：包文案 > 内置 i18n）。

### 交互升级

- **拖拽换位**：立绘本体支持指针拖拽（位移 <6px 视为点击，不破坏摸摸判定），
  位置以 `skcode-pet-pos`（right/bottom px）持久化；越界自动收敛回容器内。
- **粒子**：摸摸冒爱心（v2）、done/celebrate 冒星星、sleepy 冒 Zzz；
  全部 CSS 动画，随 `petEffectsEnabled` 与 `prefers-reduced-motion` 关闭。
- **点击反应池扩充**：新增转圈/雀跃动作；8% 概率触发"开心到转圈+星星"特别反应。

### 设置（设置 → 通用，宠物卡片内新增）

- **大小**：滑杆 112–320px（默认 224），`skcode-pet-size` 持久化；窄容器仍由
  `@container` 上限约束。
- **气泡台词**：开关（默认开）。
- **互动特效**：开关（默认开）。
- **重置位置**：按钮，清除 `skcode-pet-pos`。

全部宠物偏好仍为 renderer zustand + localStorage，不进 `BROADCAST_FIELDS`。

### 包格式扩展

manifest 新增可选字段（全部走 `PET_PACK_ASSET_NAME_PATTERN` 白名单；
`moodVideos`/`idleVideo`/`workingVideo` 允许动态 WebP 或带 alpha 的 WebM，
`.webp` 由 `<img>` 播放、`.webm` 由 `<video>` 播放）：

```
moodVideos?: { greet? celebrate? sad? thinking? asking? puzzled? sleepy? }
moodImages?: { 同上 }
greetLines? / moodLines?: { working? permission? question? error? done? thinking? }[]
```

渲染层对缺失项按 idle→working 链回退；内置包在 `builtinPet.ts` 同构维护。

### 验收场景（v5 增量）

1. 每个情绪位都播放对应视频循环；`prefers-reduced-motion` 或视频损坏时显示同情绪静态图。
2. prewarming 显示思考动作；error 显示伤心动作；completedSuccess 显示庆祝动作 + 星星。
3. 会话面板首次挂载（idle）挥手打招呼并冒一句问候语；3s 后回 idle 循环。
4. 空闲 90s 后进入犯困态（sleepy 循环 + Zzz 粒子）；点击或新任务立即唤醒。
5. 拖拽立绘可换位，松手持久化；重启后位置保留；重置位置按钮恢复默认。
6. 大小滑杆即时生效并持久化；气泡/特效开关分别生效且持久化。
7. 台词随机池生效：同一情绪多次触发文案不同；用户包自定义池优先。
8. v4 的包系统行为不变：无 moodVideos 的用户包按回退链正常显示。

### 验收场景（v4）

1. 默认（无用户包）行为与 v3 完全一致，选择器只有 SilverKorali。
2. 手工放入一个合法包目录 → 设置里重新扫描后出现在选择器，选中即生效（立绘/视频/文案随包）。
3. manifest 非法（缺 name/idleImage）的目录被跳过，不影响其它包。
4. 「用 AI 创建宠物」→ 打开草稿任务并预填脚手架提示词；Agent 按模板产出包后可被扫描选用。
5. 资产路径逃逸（`../`、子目录）被 main 拒绝，返回 null。
6. web 端选择器仅内置包；显示开关与 v2 行为一致。
