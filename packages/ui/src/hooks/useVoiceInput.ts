import { useCallback, useEffect, useRef, useState } from "react";
import type { AsrSettings, AsrTranscribeRequest } from "@skcode/shared";
import { usePlatform } from "@/hooks/usePlatform.js";
import { logger } from "@/logger.js";

/**
 * 语音输入录音 hook：麦克风采集 → 16kHz/16bit/单声道 PCM → ASR 转写。
 * 录音状态机 idle/recording/transcribing 为组件局部状态（不入全局 store）。
 * 采集用 AudioWorklet（blob module），避免已废弃的 ScriptProcessor。
 */

export type VoiceInputStatus = "idle" | "recording" | "transcribing";

const TARGET_SAMPLE_RATE = 16000;

const CAPTURE_WORKLET = `
class SkcodePcmCapture extends AudioWorkletProcessor {
  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (channel && channel.length > 0) {
      this.port.postMessage(new Float32Array(channel));
    }
    return true;
  }
}
registerProcessor("skcode-pcm-capture", SkcodePcmCapture);
`;

/** Float32 采集块（源采样率）→ 16k Int16LE，跨块保持相位连续。 */
function createPcmDownsampler(sourceRate: number) {
  let last = 0;
  return (chunk: Float32Array): Int16Array => {
    const ratio = sourceRate / TARGET_SAMPLE_RATE;
    const outLength = Math.floor(chunk.length / ratio);
    const out = new Int16Array(outLength);
    for (let i = 0; i < outLength; i += 1) {
      const pos = i * ratio;
      const idx = Math.floor(pos);
      const frac = pos - idx;
      const a = (idx === 0 ? last : chunk[idx - 1]) ?? last;
      const b = chunk[Math.min(idx, chunk.length - 1)] ?? 0;
      const sample = a + (b - a) * frac;
      out[i] = Math.max(-32768, Math.min(32767, Math.round(sample * 32767)));
    }
    last = chunk[chunk.length - 1] ?? 0;
    return out;
  };
}

/** renderer 环境无 Node Buffer，用 btoa 做 base64。 */
function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    binary += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return btoa(binary);
}

function concatPcm(chunks: Int16Array[]): Uint8Array {
  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Int16Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return new Uint8Array(out.buffer);
}

export function useVoiceInput(options: {
  settings: AsrSettings | undefined;
  onTranscript: (text: string) => void;
  onError: (message: string) => void;
}) {
  const platform = usePlatform();
  const [status, setStatus] = useState<VoiceInputStatus>("idle");
  const statusRef = useRef<VoiceInputStatus>("idle");
  const chunksRef = useRef<Int16Array[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);
  const downsampleRef = useRef<((chunk: Float32Array) => Int16Array) | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const teardown = useCallback(() => {
    workletRef.current?.disconnect();
    workletRef.current = null;
    for (const track of streamRef.current?.getTracks() ?? []) {
      track.stop();
    }
    streamRef.current = null;
    void contextRef.current?.close().catch(() => {});
    contextRef.current = null;
    downsampleRef.current = null;
  }, []);

  const stopAndTranscribe = useCallback(async () => {
    statusRef.current = "transcribing";
    setStatus("transcribing");
    teardown();
    const pcm = concatPcm(chunksRef.current);
    chunksRef.current = [];
    if (pcm.length === 0) {
      statusRef.current = "idle";
      setStatus("idle");
      return;
    }
    const { settings, onTranscript, onError } = optionsRef.current;
    if (!settings) {
      statusRef.current = "idle";
      setStatus("idle");
      onError("语音识别未配置");
      return;
    }
    try {
      const request: AsrTranscribeRequest = {
        pcmBase64: toBase64(pcm),
        sampleRate: TARGET_SAMPLE_RATE,
        settings,
      };
      const result = await platform.asrTranscribe?.(request);
      if (result?.ok && result.text) {
        onTranscript(result.text);
      } else {
        onError(result?.error || "语音识别失败");
      }
    } catch (error) {
      logger.warn("[voice-input] transcribe failed", { error });
      onError("语音识别失败");
    } finally {
      statusRef.current = "idle";
      setStatus("idle");
    }
  }, [platform, teardown]);

  const toggle = useCallback(async () => {
    if (statusRef.current === "transcribing") {
      return;
    }
    if (statusRef.current === "recording") {
      await stopAndTranscribe();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      const context = new AudioContext();
      const workletUrl = URL.createObjectURL(
        new Blob([CAPTURE_WORKLET], { type: "application/javascript" }),
      );
      await context.audioWorklet.addModule(workletUrl);
      URL.revokeObjectURL(workletUrl);
      const source = context.createMediaStreamSource(stream);
      const node = new AudioWorkletNode(context, "skcode-pcm-capture");
      const downsample = createPcmDownsampler(context.sampleRate);
      node.port.onmessage = (event: MessageEvent<Float32Array>) => {
        const pcm = downsample(event.data);
        if (pcm.length > 0) {
          chunksRef.current.push(pcm);
        }
      };
      source.connect(node);
      // 不接 destination，避免回采扬声器。
      streamRef.current = stream;
      contextRef.current = context;
      workletRef.current = node;
      downsampleRef.current = downsample;
      chunksRef.current = [];
      statusRef.current = "recording";
      setStatus("recording");
    } catch (error) {
      logger.warn("[voice-input] mic capture failed", { error });
      teardown();
      optionsRef.current.onError("无法访问麦克风");
    }
  }, [stopAndTranscribe, teardown]);

  useEffect(() => () => teardown(), [teardown]);

  return { status, toggle };
}
