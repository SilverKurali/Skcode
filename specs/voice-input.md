# 语音输入 Spec：composer 语音按钮 + ASR 识别

## 背景与决策

Skcode 缺少语音输入。整合 [audio-talk-ai]（Go 语音输入工具）的 ASR 能力，
**移植其 ASR 协议层为 TypeScript**，不引入 Go sidecar：

- 录音在渲染进程（Web Audio：16kHz / 16bit / 单声道 PCM）。
- ASR 调用在主进程（Node `fetch` / 全局 `WebSocket`，无 CORS 约束），音频经 IPC base64 传递。
- **不做全局热键**（用户决策）：只有 composer 语音按钮，点击 toggle 开始/停止录音。
- ASR 配置放在**设置 → 模型设置**分区的「语音识别」卡片（用户决策：随模型管理界面）。
- [audio-talk-ai] 仅作协议参考（讯飞 HMAC 签名、Whisper multipart 等），不复制其代码与资产。

## 交互

```
composer 工具条：[+ 附件] [模式 ▾] … [管理模型 ▾] [思考 ▾] [🎤 语音] [↑ 发送]
                                              └── 新增按钮（思考右侧、发送左侧）
```

- 点击 🎤：开始录音（按钮变红 + 脉冲动画）；再点：停止 → 识别 → 文本插入 composer 草稿（不自动发送）。
- 识别中按钮转圈；失败 toast 提示（保留已录文本可重试）。
- 未配置 ASR 时点击 → 引导跳设置「语音识别」卡。
- 录音/识别期间禁用发送？不禁用（草稿独立），但按钮状态互斥（不可重入）。

## 状态所有者

- **录音状态**：`useVoiceInput` hook 局部状态（idle/recording/transcribing），不入全局 store。
- **ASR 配置**：`AppSettings.asr`（zod schema，main settingService 持久化 `~/.skcode/v2/setting.json`）：
  ```ts
  {
    enabled: boolean;                 // 是否启用语音输入
    provider: "openai-whisper" | "xfyun-iat";
    language: string;                 // 默认 zh
    hotwords: string[];               // 热词（prompt/领域词）
    providers: {                      // 每服务商凭据（字段与 audio-talk-ai metadata 对齐）
      "openai-whisper": { apiKey, baseUrl, model };
      "xfyun-iat": { appId, apiKey, apiSecret, domain?, accent?, dwa? };
    };
  }
  ```
  凭据不写日志（AGENTS.md 红线）。
- **ASR 客户端**（main 进程 `desktopAsr.ts`）：`transcribe(pcmBase64, config) → text`；
  合同与 audio-talk-ai 一致——分块推送、**累计全文**返回。

## 事件顺序

```
点 🎤 → getUserMedia → AudioWorklet 采集 PCM16/16k →（录音中按钮红）
再点 🎤 → 停止采集 → IPC AsrTranscribe(pcm, cfg)
        → main：Whisper REST / 讯飞 WS（HMAC 签名握手 + 分帧推流收累计文本）
        → 文本插回 composer 草稿光标处
```

## 引擎（v1）

| 引擎           | 协议                           | 认证                 | 说明                                 |
| -------------- | ------------------------------ | -------------------- | ------------------------------------ |
| openai-whisper | POST multipart（WAV 包装 PCM） | Bearer               | `base_url` 可指向 Ollama 等兼容端点  |
| xfyun-iat      | WSS JSON 分帧（1280B/帧）      | URL HMAC-SHA256 签名 | 讯飞语音听写，支持 domain/accent/dwa |

其余引擎（豆包、讯飞实时/录音转写、MiMo、OpenAI Realtime）后续按同一接口扩展。

## 验收场景

1. 未配置 ASR：点 🎤 提示先配置并跳设置。
2. 配置 Whisper（含 Ollama 兼容端点）：录一段 → 停止 → 文本插入草稿。
3. 配置讯飞 iat：同上（签名握手成功）。
4. 录音中再点停止；录音中按钮红色动画；识别中转圈；失败有错误提示。
5. 凭据不出现在任何日志。
6. 关闭 `enabled`：语音按钮隐藏。
7. `pnpm typecheck` / `pnpm lint` 通过；每步可 `git revert` 回滚。

## v2 增量：跳转目标与录音动效

- 未配置 ASR 时点击语音按钮 → 设置「语音输入」分区（此前误跳「模型供应商」）。
  跳转由 SessionPane 的 `handleOpenVoiceInputSettings` 写入
  `pendingSettingsSectionIntent("voiceInput")` 后 `openSettingsTab()`。
- 录音动效（提醒用户麦克风使用中）：
  - 按钮：destructive 红底 + 外圈 ping 扩散环 + 柔和红色光晕；
  - 整个 composer 输入框叠加呼吸红光（`skcode-voice-recording-glow`，1.6s 循环）；
  - 录音状态由 VoiceInputButton 经 `onRecordingChange` 提升到 ConversationComposer；
  - `prefers-reduced-motion` 下保留静态红色描边，去掉动画。
- 转写中保持转圈 loading；期间按钮禁用。
