import { useCallback, useEffect } from "react";
import { Loader2Icon, MicIcon, SquareIcon } from "lucide-react";
import type { AsrSettings } from "@skcode/shared";
import { Button } from "@/components/ui/button.js";
import { ControlHintTooltip } from "@/ControlHintTooltip.js";
import { useVoiceInput } from "@/hooks/useVoiceInput.js";
import { cn } from "@/components/lib/utils.js";
import { useSkcodeIntl } from "@/i18n/IntlProvider.js";

/** ASR 凭据是否足以发起转写（与引擎必填字段对齐）。 */
export function isAsrConfigured(settings: AsrSettings | undefined): boolean {
  if (!settings?.enabled) {
    return false;
  }
  if (settings.provider === "xfyun-iat") {
    const creds = settings.providers["xfyun-iat"];
    return Boolean(creds.appId.trim() && creds.apiKey.trim() && creds.apiSecret.trim());
  }
  return Boolean(settings.providers["openai-whisper"].apiKey.trim());
}

/**
 * composer 语音按钮：点击 toggle 录音，识别文本经 onTranscript 回调插入草稿。
 * 位置约定（specs/voice-input.md）：思考开关右侧、发送键左侧。
 */
export function VoiceInputButton({
  settings,
  onTranscript,
  onOpenAsrSettings,
  onToast,
  onRecordingChange,
  disabled = false,
}: {
  settings: AsrSettings | undefined;
  onTranscript: (text: string) => void;
  onOpenAsrSettings?: () => void;
  onToast: (message: string) => void;
  /** 录音状态外抛：composer 用它在整个输入框上叠呼吸红光。 */
  onRecordingChange?: (recording: boolean) => void;
  disabled?: boolean;
}) {
  const { intl } = useSkcodeIntl();
  const { status, toggle } = useVoiceInput({
    settings,
    onTranscript,
    onError: (message) => onToast(message),
  });
  const recording = status === "recording";
  useEffect(() => {
    onRecordingChange?.(recording);
  }, [recording, onRecordingChange]);

  const handleClick = useCallback(() => {
    if (!isAsrConfigured(settings)) {
      onOpenAsrSettings?.();
      return;
    }
    void toggle();
  }, [settings, toggle, onOpenAsrSettings]);

  const label = intl.formatMessage({
    id:
      status === "recording"
        ? "voiceInput.stop"
        : status === "transcribing"
          ? "voiceInput.transcribing"
          : "voiceInput.start",
  });

  return (
    <ControlHintTooltip title={label}>
      <span className="relative inline-flex">
        {recording ? (
          <span
            aria-hidden="true"
            className="absolute -inset-1 animate-ping rounded-lg border-2 border-destructive/60"
          />
        ) : null}
        <Button
          type="button"
          variant={status === "recording" ? "destructive" : "ghost"}
          size="icon-md"
          disabled={disabled || status === "transcribing"}
          onClick={handleClick}
          data-testid="v4-composer-voice-input"
          aria-label={label}
          className={cn("relative", recording && "shadow-[0_0_12px_2px_rgb(239_68_68/0.45)]")}
        >
          {status === "transcribing" ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : status === "recording" ? (
            <SquareIcon className="size-4 fill-current" />
          ) : (
            <MicIcon className="size-4" />
          )}
          <span className="sr-only">{label}</span>
        </Button>
      </span>
    </ControlHintTooltip>
  );
}
