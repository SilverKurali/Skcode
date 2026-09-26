import { z } from "zod";

/**
 * 语音输入（ASR）配置。协议细节移植自 audio-talk-ai（仅作参考，未复制代码），
 * 凭据字段与其 ProviderMeta 字段对齐。凭据不得写入日志（AGENTS.md 红线）。
 */

export const asrProviderIdSchema = z.enum(["openai-whisper", "xfyun-iat", "doubao", "xiaomi-mimo"]);
export type AsrProviderId = z.infer<typeof asrProviderIdSchema>;

/** OpenAI Whisper 批量转写；base_url 可指向 Ollama 等兼容端点。 */
export const whisperAsrCredentialsSchema = z.object({
  apiKey: z.string().default(""),
  baseUrl: z.string().default("https://api.openai.com/v1/audio/transcriptions"),
  model: z.string().default("whisper-1"),
});
export type WhisperAsrCredentials = z.infer<typeof whisperAsrCredentialsSchema>;

/** 讯飞语音听写（流式 WSS，URL HMAC-SHA256 签名）。 */
export const xfyunIatCredentialsSchema = z.object({
  appId: z.string().default(""),
  apiKey: z.string().default(""),
  apiSecret: z.string().default(""),
  domain: z.string().default("iat"),
  accent: z.string().default("mandarin"),
  /** "wpgs" 动态修正；空串关闭。 */
  dwa: z.string().default(""),
});
export type XfyunIatCredentials = z.infer<typeof xfyunIatCredentialsSchema>;

/** 豆包（火山引擎流式 SAUC）：token 头鉴权，WSS 二进制帧。 */
export const doubaoAsrCredentialsSchema = z.object({
  appKey: z.string().default(""),
  accessKey: z.string().default(""),
  resourceId: z.string().default("volc.bigasr.sauc.duration"),
});
export type DoubaoAsrCredentials = z.infer<typeof doubaoAsrCredentialsSchema>;

/** 小米 MiMo ASR：chat/completions 形式；billing 切换计费 API 与 Token Plan 节点。 */
export const xiaomiMimoAsrCredentialsSchema = z.object({
  apiKey: z.string().default(""),
  model: z.string().default("mimo-v2.5-asr"),
  /** "api"=按量计费端点；"tokenplan"=Token Plan 国内节点。 */
  billing: z.enum(["api", "tokenplan"]).default("api"),
});
export type XiaomiMimoAsrCredentials = z.infer<typeof xiaomiMimoAsrCredentialsSchema>;

export const asrSettingsSchema = z.object({
  /** 总开关：false 时 composer 隐藏语音按钮。 */
  enabled: z.boolean().default(false),
  provider: asrProviderIdSchema.default("openai-whisper"),
  language: z.string().default("zh"),
  /** 热词：增强专有名词识别（Whisper 走 prompt，讯飞走 dhw）。 */
  hotwords: z.array(z.string()).default([]),
  providers: z
    .object({
      "openai-whisper": whisperAsrCredentialsSchema,
      "xfyun-iat": xfyunIatCredentialsSchema,
      doubao: doubaoAsrCredentialsSchema,
      "xiaomi-mimo": xiaomiMimoAsrCredentialsSchema,
    })
    .default(() => ({
      "openai-whisper": {
        apiKey: "",
        baseUrl: "https://api.openai.com/v1/audio/transcriptions",
        model: "whisper-1",
      },
      "xfyun-iat": {
        appId: "",
        apiKey: "",
        apiSecret: "",
        domain: "iat",
        accent: "mandarin",
        dwa: "",
      },
      doubao: { appKey: "", accessKey: "", resourceId: "volc.bigasr.sauc.duration" },
      "xiaomi-mimo": { apiKey: "", model: "mimo-v2.5-asr", billing: "api" as const },
    })),
});

export type AsrSettings = z.infer<typeof asrSettingsSchema>;

/** 一次转写请求：PCM16LE 单声道 16kHz，base64 传递（main 进程解码后调 ASR API）。 */
export interface AsrTranscribeRequest {
  pcmBase64: string;
  sampleRate: number;
  settings: AsrSettings;
}

export interface AsrTranscribeResult {
  ok: boolean;
  text?: string;
  /** 用户可读错误；不得包含凭据。 */
  error?: string;
}

/** AsrTranscribe IPC 请求体校验（main 侧入口防线）。 */
export const asrTranscribeRequestSchema = z.object({
  pcmBase64: z.string().max(24 * 1024 * 1024),
  sampleRate: z.number().int().positive().default(16000),
  settings: asrSettingsSchema,
});
