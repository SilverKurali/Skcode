/* eslint-disable max-lines -- ASR 协议实现集中维护（Whisper/讯飞/豆包/小米各自的
   鉴权与分帧细节），拆散会让协议对照与移植审计更困难。 */
import { createHmac } from "node:crypto";
import type { AsrTranscribeRequest, AsrTranscribeResult } from "@skcode/shared";

/**
 * ASR 转写客户端（main 进程）。协议细节移植自 audio-talk-ai 的 asr 驱动
 * （仅作协议参考，未复制代码）：Whisper 批量 multipart、讯飞 iat 流式 WSS。
 * 统一约定：音频为 PCM16LE 单声道，输出为**累计全文**。
 * 凭据只进请求头/URL 签名，不写日志。
 */

const XFYUN_IAT_HOST = "iat-api.xfyun.cn";
const XFYUN_IAT_PATH = "/v2/iat";
/** 讯飞分帧大小：1280B = 40ms @16kHz/16bit/mono。 */
const XFYUN_FRAME_BYTES = 1280;
/** 讯飞最终结果等待上限。 */
const XFYUN_RESULT_TIMEOUT_MS = 60_000;
const WHISPER_TIMEOUT_MS = 60_000;

/** PCM16LE 包 WAV 头（Whisper 接口要 file 字段）。 */
function pcmToWav(pcm: Uint8Array, sampleRate: number): Uint8Array {
  const header = Buffer.alloc(44);
  const byteRate = sampleRate * 2;
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, Buffer.from(pcm)]);
}

function normalizeLang(language: string): string {
  const lang = language.trim().toLowerCase();
  if (lang.startsWith("zh")) return "zh";
  return lang.slice(0, 2);
}

async function transcribeWhisper(
  pcm: Uint8Array,
  sampleRate: number,
  settings: AsrTranscribeRequest["settings"],
): Promise<string> {
  const creds = settings.providers["openai-whisper"];
  if (!creds.apiKey.trim()) {
    throw new Error("未配置 OpenAI Whisper API Key");
  }
  const form = new FormData();
  form.append("model", creds.model || "whisper-1");
  form.append("language", normalizeLang(settings.language || "zh"));
  if (settings.hotwords.length > 0) {
    form.append("prompt", settings.hotwords.join(", "));
  }
  const wav = pcmToWav(pcm, sampleRate);
  form.append("file", new Blob([new Uint8Array(wav)], { type: "audio/wav" }), "audio.wav");

  const response = await fetch(creds.baseUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${creds.apiKey}` },
    body: form,
    signal: AbortSignal.timeout(WHISPER_TIMEOUT_MS),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    // 剥离可能回显 key 的响应体细节，只留状态与短消息。
    throw new Error(
      `Whisper 请求失败（HTTP ${response.status}）${detail ? `: ${detail.slice(0, 120)}` : ""}`,
    );
  }
  const data = (await response.json()) as { text?: string };
  return data.text ?? "";
}

/** 讯飞 iat 鉴权：HMAC-SHA256 签名进 WSS URL（无自定义请求头）。 */
function buildXfyunIatUrl(apiKey: string, apiSecret: string): string {
  const date = new Date().toUTCString();
  const signOrigin = `host: ${XFYUN_IAT_HOST}\ndate: ${date}\nGET ${XFYUN_IAT_PATH} HTTP/1.1`;
  const signature = createHmac("sha256", apiSecret).update(signOrigin).digest("base64");
  const authorization = Buffer.from(
    `api_key="${apiKey}",algorithm="hmac-sha256",headers="host date request-line",signature="${signature}"`,
  ).toString("base64");
  return (
    `wss://${XFYUN_IAT_HOST}${XFYUN_IAT_PATH}` +
    `?authorization=${encodeURIComponent(authorization)}&date=${encodeURIComponent(date)}&host=${XFYUN_IAT_HOST}`
  );
}

interface XfyunFrame {
  code?: number;
  message?: string;
  data?: {
    status?: number;
    result?: {
      sn?: number;
      pgs?: "rpl" | "apd";
      rg?: [number, number];
      ws?: { cw?: { w?: string }[] }[];
    };
  };
}

function extractFrameText(frame: XfyunFrame): string {
  const ws = frame.data?.result?.ws ?? [];
  return ws.map((seg) => (seg.cw ?? []).map((cw) => cw.w ?? "").join("")).join("");
}

async function transcribeXfyunIat(
  pcm: Uint8Array,
  settings: AsrTranscribeRequest["settings"],
): Promise<string> {
  const creds = settings.providers["xfyun-iat"];
  if (!creds.appId.trim() || !creds.apiKey.trim() || !creds.apiSecret.trim()) {
    throw new Error("未配置讯飞语音听写凭据（AppID / APIKey / APISecret）");
  }
  const url = buildXfyunIatUrl(creds.apiKey, creds.apiSecret);
  const ws = new WebSocket(url);

  // 讯飞按 sn 分段维护文本；rpl 替换 rg 区间、apd 追加（与 audio-talk-ai 语义一致）。
  const segments = new Map<number, string>();
  let resolveText: (text: string) => void;
  let rejectText: (error: Error) => void;
  const done = new Promise<string>((resolve, reject) => {
    resolveText = resolve;
    rejectText = reject;
  });

  const finish = () => {
    const text = [...segments.entries()]
      .sort(([a], [b]) => a - b)
      .map(([, v]) => v)
      .join("");
    try {
      ws.close();
    } catch {
      // 关闭失败不影响结果。
    }
    resolveText(text);
  };

  const timer = setTimeout(() => {
    rejectText(new Error("讯飞识别超时"));
    try {
      ws.close();
    } catch {
      // 忽略。
    }
  }, XFYUN_RESULT_TIMEOUT_MS);

  ws.onmessage = (event) => {
    let frame: XfyunFrame;
    try {
      frame = JSON.parse(String(event.data)) as XfyunFrame;
    } catch {
      return;
    }
    if (typeof frame.code === "number" && frame.code !== 0) {
      clearTimeout(timer);
      rejectText(new Error(`讯飞识别失败（${frame.code}）`));
      return;
    }
    const result = frame.data?.result;
    if (result?.sn !== undefined) {
      const text = extractFrameText(frame);
      if (result.pgs === "rpl" && result.rg) {
        const [start, end] = result.rg;
        for (let sn = start; sn <= end; sn += 1) {
          segments.delete(sn);
        }
      }
      segments.set(result.sn, text);
    }
    if (frame.data?.status === 2) {
      clearTimeout(timer);
      finish();
    }
  };

  ws.onerror = () => {
    clearTimeout(timer);
    rejectText(new Error("讯飞连接失败"));
  };

  await new Promise<void>((resolve, reject) => {
    ws.onopen = () => resolve();
    ws.onerror = () => reject(new Error("讯飞连接失败"));
  });

  // 首帧带 common/business；随后按 1280B 分帧；末帧 status=2（余量并入）。
  const firstLen = Math.min(XFYUN_FRAME_BYTES, pcm.length);
  const first = pcm.subarray(0, firstLen);
  ws.send(
    JSON.stringify({
      common: { app_id: creds.appId },
      business: {
        language: "zh_cn",
        domain: creds.domain || "iat",
        accent: creds.accent || "mandarin",
        eos: 6000,
        ...(creds.dwa ? { dwa: creds.dwa } : {}),
        ...(settings.hotwords.length > 0 ? { dhw: settings.hotwords.join(",") } : {}),
      },
      data: {
        status: 0,
        format: "audio/L16;rate=16000",
        encoding: "raw",
        audio: Buffer.from(first).toString("base64"),
      },
    }),
  );
  for (
    let offset = firstLen;
    offset + XFYUN_FRAME_BYTES <= pcm.length;
    offset += XFYUN_FRAME_BYTES
  ) {
    ws.send(
      JSON.stringify({
        data: {
          status: 1,
          format: "audio/L16;rate=16000",
          encoding: "raw",
          audio: Buffer.from(pcm.subarray(offset, offset + XFYUN_FRAME_BYTES)).toString("base64"),
        },
      }),
    );
  }
  const rest = pcm.subarray(
    Math.max(firstLen, pcm.length - ((pcm.length - firstLen) % XFYUN_FRAME_BYTES)),
  );
  ws.send(
    JSON.stringify({
      data: {
        status: 2,
        format: "audio/L16;rate=16000",
        encoding: "raw",
        audio: Buffer.from(rest).toString("base64"),
      },
    }),
  );

  return done;
}

/** 豆包（火山引擎）二进制帧：4B header + 4B 大端长度 + payload。 */
function buildDoubaoFrame(
  messageType: number,
  flags: number,
  serialization: number,
  payload: Uint8Array,
): Uint8Array {
  const frame = new Uint8Array(8 + payload.length);
  frame[0] = 0x11;
  frame[1] = (messageType << 4) | flags;
  frame[2] = serialization;
  frame[3] = 0x00;
  new DataView(frame.buffer).setUint32(4, payload.length, false);
  frame.set(payload, 8);
  return frame;
}

function parseDoubaoResponse(data: ArrayBuffer): { text: string; final: boolean } {
  const bytes = new Uint8Array(data);
  if (bytes.length < 12) {
    return { text: "", final: false };
  }
  const flags = bytes[1] & 0x0f;
  const payloadSize = new DataView(data).getUint32(8, false);
  const payload = new TextDecoder().decode(bytes.subarray(12, 12 + payloadSize));
  let text = "";
  let definite = false;
  try {
    const parsed = JSON.parse(payload) as {
      result?: { text?: string; utterances?: { text?: string; definite?: boolean }[] };
    };
    text = parsed.result?.text ?? "";
    definite = (parsed.result?.utterances ?? []).some((u) => u.definite === true);
  } catch {
    // 非 JSON payload（异常帧）忽略。
  }
  return { text, final: flags === 0x02 || flags === 0x03 || definite };
}

function randomUuid(): string {
  return globalThis.crypto.randomUUID();
}

async function transcribeDoubao(
  pcm: Uint8Array,
  settings: AsrTranscribeRequest["settings"],
): Promise<string> {
  const creds = settings.providers.doubao;
  if (!creds.appKey.trim() || !creds.accessKey.trim()) {
    throw new Error("未配置豆包凭据（AppKey / AccessKey）");
  }
  const url = "wss://openspeech.bytedance.com/api/v3/sauc/bigmodel_async";
  // undici WebSocket 支持自定义握手头（Node 环境），豆包要求 Token 头鉴权。
  const ws = new WebSocket(url, {
    headers: {
      "X-Api-App-Key": creds.appKey,
      "X-Api-Access-Key": creds.accessKey,
      "X-Api-Resource-Id": creds.resourceId || "volc.bigasr.sauc.duration",
      "X-Api-Request-Id": randomUuid(),
      "X-Api-Connect-Id": randomUuid(),
      "X-Api-Sequence": "-1",
    },
  } as unknown as string);

  let resolveText: (text: string) => void;
  let rejectText: (error: Error) => void;
  const done = new Promise<string>((resolve, reject) => {
    resolveText = resolve;
    rejectText = reject;
  });
  const timer = setTimeout(() => {
    rejectText(new Error("豆包识别超时"));
    try {
      ws.close();
    } catch {
      // 忽略。
    }
  }, 60_000);

  ws.binaryType = "arraybuffer";
  ws.onmessage = (event) => {
    const { text, final } = parseDoubaoResponse(event.data as ArrayBuffer);
    if (final) {
      clearTimeout(timer);
      try {
        ws.close();
      } catch {
        // 忽略。
      }
      resolveText(text);
    }
  };
  ws.onerror = () => {
    clearTimeout(timer);
    rejectText(new Error("豆包连接失败"));
  };

  await new Promise<void>((resolve, reject) => {
    ws.onopen = () => resolve();
    ws.onerror = () => reject(new Error("豆包连接失败"));
  });

  // init 帧（full-client-request）：热词走 corpus.context 的 JSON 字符串。
  const init = {
    user: { uid: "skcode-voice-input" },
    audio: { format: "pcm", rate: 16000, bits: 16, channel: 1, codec: "raw" },
    request: {
      model_name: "bigmodel",
      enable_itn: true,
      enable_punc: true,
      enable_ddc: false,
      enable_word: false,
      enable_nonstream: true,
      result_type: "full",
      show_utterances: true,
      ...(settings.hotwords.length > 0
        ? {
            corpus: {
              context: JSON.stringify({
                hotwords: settings.hotwords.map((word) => ({ word })),
              }),
            },
          }
        : {}),
    },
  };
  ws.send(buildDoubaoFrame(0x10, 0x00, 0x10, new TextEncoder().encode(JSON.stringify(init))));

  // 音频帧按 1600B 分片（约 50ms @16k/16bit），最后一片带 flags=0x02。
  const chunkSize = 1600;
  for (let offset = 0; offset < pcm.length; offset += chunkSize) {
    const end = Math.min(offset + chunkSize, pcm.length);
    const isLast = end >= pcm.length;
    ws.send(buildDoubaoFrame(0x20, isLast ? 0x02 : 0x00, 0x00, pcm.subarray(offset, end)));
    if (isLast) {
      break;
    }
  }
  if (pcm.length === 0) {
    ws.send(buildDoubaoFrame(0x20, 0x02, 0x00, new Uint8Array(0)));
  }
  return done;
}

/** 小米 MiMo ASR：chat/completions 形式，audio/wav base64 进、choices 出。 */
async function transcribeXiaomiMimo(
  pcm: Uint8Array,
  sampleRate: number,
  settings: AsrTranscribeRequest["settings"],
): Promise<string> {
  const creds = settings.providers["xiaomi-mimo"];
  if (!creds.apiKey.trim()) {
    throw new Error("未配置小米 MiMo API Key");
  }
  const endpoint =
    creds.billing === "tokenplan"
      ? "https://token-plan-cn.xiaomimimo.com/v1/chat/completions"
      : "https://api.xiaomimimo.com/v1/chat/completions";
  const wav = pcmToWav(pcm, sampleRate);
  const lang = settings.language?.trim() ? normalizeLang(settings.language) : "auto";
  const body = {
    model: creds.model || "mimo-v2.5-asr",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "input_audio",
            input_audio: {
              data: `data:audio/wav;base64,${Buffer.from(wav).toString("base64")}`,
              format: "wav",
            },
          },
        ],
      },
    ],
    asr_options: {
      language: lang,
      ...(settings.hotwords.length > 0 ? { hotwords: settings.hotwords } : {}),
    },
  };
  const response = await fetch(endpoint, {
    method: "POST",
    // 小米使用 api-key 请求头（非 Bearer）。
    headers: { "api-key": creds.apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(WHISPER_TIMEOUT_MS),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `MiMo 请求失败（HTTP ${response.status}）${detail ? `: ${detail.slice(0, 120)}` : ""}`,
    );
  }
  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? "";
}

export async function transcribeAsr(request: AsrTranscribeRequest): Promise<AsrTranscribeResult> {
  try {
    const pcm = Buffer.from(request.pcmBase64, "base64");
    if (pcm.length === 0) {
      return { ok: false, error: "录音为空" };
    }
    const provider = request.settings.provider;
    const text =
      provider === "xfyun-iat"
        ? await transcribeXfyunIat(pcm, request.settings)
        : provider === "doubao"
          ? await transcribeDoubao(pcm, request.settings)
          : provider === "xiaomi-mimo"
            ? await transcribeXiaomiMimo(pcm, request.sampleRate || 16000, request.settings)
            : await transcribeWhisper(pcm, request.sampleRate || 16000, request.settings);
    return { ok: true, text: text.trim() };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "语音识别失败" };
  }
}
