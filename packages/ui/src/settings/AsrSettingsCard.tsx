import { useCallback, useEffect, useRef, useState } from "react";
import type { AsrProviderId, AsrSettings } from "@skcode/shared";
import { Button } from "@/components/ui/button.js";
import { Input } from "@/components/ui/input.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.js";
import { Switch } from "@/components/ui/switch.js";
import { SettingsGroupCard, SettingsRow } from "@/settings/SettingsPageParts.js";
import { useSettings } from "@/hooks/useSettingService.js";
import { useSkcodeIntl } from "@/i18n/IntlProvider.js";

const EMPTY_PROVIDERS: AsrSettings["providers"] = {
  "openai-whisper": {
    apiKey: "",
    baseUrl: "https://api.openai.com/v1/audio/transcriptions",
    model: "whisper-1",
  },
  "xfyun-iat": { appId: "", apiKey: "", apiSecret: "", domain: "iat", accent: "mandarin", dwa: "" },
  doubao: { appKey: "", accessKey: "", resourceId: "volc.bigasr.sauc.duration" },
  "xiaomi-mimo": { apiKey: "", model: "mimo-v2.5-asr", billing: "api" },
};

/** 语音识别（ASR）配置卡：挂在设置 → 模型设置（语音输入凭据随模型管理）。 */
export function AsrSettingsCard() {
  const { intl } = useSkcodeIntl();
  const { settings, update } = useSettings();
  const asr = settings?.asr;

  // 字段编辑先进本地草稿，点「保存」才落盘；「移除」清空当前服务商凭据。
  const [draft, setDraft] = useState<AsrSettings>(() => ({
    enabled: asr?.enabled ?? false,
    provider: asr?.provider ?? "openai-whisper",
    language: asr?.language ?? "zh",
    hotwords: asr?.hotwords ?? [],
    providers: {
      "openai-whisper": {
        ...EMPTY_PROVIDERS["openai-whisper"],
        ...asr?.providers["openai-whisper"],
      },
      "xfyun-iat": { ...EMPTY_PROVIDERS["xfyun-iat"], ...asr?.providers["xfyun-iat"] },
      doubao: { ...EMPTY_PROVIDERS.doubao, ...asr?.providers.doubao },
      "xiaomi-mimo": { ...EMPTY_PROVIDERS["xiaomi-mimo"], ...asr?.providers["xiaomi-mimo"] },
    },
  }));
  const hydratedRef = useRef(false);
  useEffect(() => {
    // 设置读取是异步的：首次拿到持久化配置时回填草稿（仅一次，避免覆盖未保存编辑）。
    if (hydratedRef.current || !asr) {
      return;
    }
    hydratedRef.current = true;
    setDraft({
      enabled: asr.enabled,
      provider: asr.provider,
      language: asr.language,
      hotwords: asr.hotwords,
      providers: {
        "openai-whisper": {
          ...EMPTY_PROVIDERS["openai-whisper"],
          ...asr.providers["openai-whisper"],
        },
        "xfyun-iat": { ...EMPTY_PROVIDERS["xfyun-iat"], ...asr.providers["xfyun-iat"] },
        doubao: { ...EMPTY_PROVIDERS.doubao, ...asr.providers.doubao },
        "xiaomi-mimo": { ...EMPTY_PROVIDERS["xiaomi-mimo"], ...asr.providers["xiaomi-mimo"] },
      },
    });
  }, [asr]);

  const patch = useCallback((next: Partial<AsrSettings>) => {
    setDraft((current) => ({ ...current, ...next }));
  }, []);

  /** 单服务商单字段更新；其余服务商沿用草稿现值。 */
  const patchProvider = useCallback(
    <K extends AsrProviderId>(id: K, values: Partial<AsrSettings["providers"][K]>) => {
      setDraft((current) => ({
        ...current,
        providers: {
          ...current.providers,
          [id]: { ...current.providers[id], ...values },
        },
      }));
    },
    [],
  );

  const handleSave = useCallback(() => {
    void update({ asr: draft });
  }, [draft, update]);

  const handleRemove = useCallback(() => {
    // 移除：清空当前服务商凭据并保存；开关/语言/热词保留。
    setDraft((current) => {
      const cleared: AsrSettings = {
        ...current,
        providers: {
          ...current.providers,
          [current.provider]: { ...EMPTY_PROVIDERS[current.provider] },
        },
      };
      void update({ asr: cleared });
      return cleared;
    });
  }, [update]);

  const provider = draft.provider;
  const whisper = draft.providers["openai-whisper"];
  const xfyun = draft.providers["xfyun-iat"];
  const doubao = draft.providers.doubao;
  const mimo = draft.providers["xiaomi-mimo"];

  const textInput = (
    labelId: string,
    value: string,
    onValue: (value: string) => void,
    opts: { secret?: boolean; placeholder?: string; descriptionId?: string } = {},
  ) => (
    <SettingsRow
      label={intl.formatMessage({ id: labelId })}
      description={opts.descriptionId ? intl.formatMessage({ id: opts.descriptionId }) : undefined}
      control={
        <Input
          size="lg"
          type={opts.secret ? "password" : "text"}
          className="max-w-[520px]"
          value={value}
          placeholder={opts.placeholder}
          onChange={(event) => onValue(event.currentTarget.value)}
        />
      }
    />
  );

  return (
    <SettingsGroupCard>
      <SettingsRow
        label={intl.formatMessage({ id: "settings.asr.title" })}
        description={intl.formatMessage({ id: "settings.asr.description" })}
        control={
          <Switch
            checked={draft.enabled}
            onCheckedChange={(checked) => patch({ enabled: checked })}
            aria-label={intl.formatMessage({ id: "settings.asr.title" })}
          />
        }
      />
      {draft.enabled ? (
        <>
          <SettingsRow
            controlLayout="wide"
            label={intl.formatMessage({ id: "settings.asr.provider" })}
            description={intl.formatMessage({ id: "settings.asr.providerDescription" })}
            control={
              <Select
                value={provider}
                onValueChange={(value) => patch({ provider: value as AsrProviderId })}
              >
                <SelectTrigger
                  size="lg"
                  className="w-full min-w-0 sm:w-64"
                  aria-label={intl.formatMessage({ id: "settings.asr.provider" })}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai-whisper">
                    {intl.formatMessage({ id: "settings.asr.provider.whisper" })}
                  </SelectItem>
                  <SelectItem value="xfyun-iat">
                    {intl.formatMessage({ id: "settings.asr.provider.xfyunIat" })}
                  </SelectItem>
                  <SelectItem value="doubao">
                    {intl.formatMessage({ id: "settings.asr.provider.doubao" })}
                  </SelectItem>
                  <SelectItem value="xiaomi-mimo">
                    {intl.formatMessage({ id: "settings.asr.provider.xiaomiMimo" })}
                  </SelectItem>
                </SelectContent>
              </Select>
            }
          />
          {provider === "openai-whisper" ? (
            <>
              {textInput(
                "settings.asr.whisper.apiKey",
                whisper?.apiKey ?? "",
                (v) => patchProvider("openai-whisper", { apiKey: v }),
                { secret: true, placeholder: "sk-…" },
              )}
              {textInput(
                "settings.asr.whisper.baseUrl",
                whisper?.baseUrl ?? "",
                (v) => patchProvider("openai-whisper", { baseUrl: v }),
                { descriptionId: "settings.asr.whisper.baseUrlDescription" },
              )}
              {textInput(
                "settings.asr.whisper.model",
                whisper?.model ?? "",
                (v) => patchProvider("openai-whisper", { model: v }),
                { placeholder: "whisper-1" },
              )}
            </>
          ) : provider === "xfyun-iat" ? (
            <>
              {textInput("settings.asr.xfyun.appId", xfyun?.appId ?? "", (v) =>
                patchProvider("xfyun-iat", { appId: v }),
              )}
              {textInput(
                "settings.asr.xfyun.apiKey",
                xfyun?.apiKey ?? "",
                (v) => patchProvider("xfyun-iat", { apiKey: v }),
                { secret: true },
              )}
              {textInput(
                "settings.asr.xfyun.apiSecret",
                xfyun?.apiSecret ?? "",
                (v) => patchProvider("xfyun-iat", { apiSecret: v }),
                { secret: true },
              )}
            </>
          ) : provider === "doubao" ? (
            <>
              {textInput("settings.asr.doubao.appKey", doubao?.appKey ?? "", (v) =>
                patchProvider("doubao", { appKey: v }),
              )}
              {textInput(
                "settings.asr.doubao.accessKey",
                doubao?.accessKey ?? "",
                (v) => patchProvider("doubao", { accessKey: v }),
                { secret: true },
              )}
              {textInput(
                "settings.asr.doubao.resourceId",
                doubao?.resourceId ?? "",
                (v) => patchProvider("doubao", { resourceId: v }),
                {
                  placeholder: "volc.bigasr.sauc.duration",
                  descriptionId: "settings.asr.doubao.resourceIdDescription",
                },
              )}
            </>
          ) : (
            <>
              {textInput(
                "settings.asr.xiaomiMimo.apiKey",
                mimo?.apiKey ?? "",
                (v) => patchProvider("xiaomi-mimo", { apiKey: v }),
                { secret: true },
              )}
              {textInput(
                "settings.asr.xiaomiMimo.model",
                mimo?.model ?? "",
                (v) => patchProvider("xiaomi-mimo", { model: v }),
                { placeholder: "mimo-v2.5-asr" },
              )}
              <SettingsRow
                controlLayout="wide"
                label={intl.formatMessage({ id: "settings.asr.xiaomiMimo.billing" })}
                description={intl.formatMessage({
                  id: "settings.asr.xiaomiMimo.billingDescription",
                })}
                control={
                  <Select
                    value={mimo?.billing ?? "api"}
                    onValueChange={(value) =>
                      patchProvider("xiaomi-mimo", {
                        billing: value === "tokenplan" ? "tokenplan" : "api",
                      })
                    }
                  >
                    <SelectTrigger
                      size="lg"
                      className="w-full min-w-0 sm:w-64"
                      aria-label={intl.formatMessage({
                        id: "settings.asr.xiaomiMimo.billing",
                      })}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="api">
                        {intl.formatMessage({ id: "settings.asr.xiaomiMimo.billing.api" })}
                      </SelectItem>
                      <SelectItem value="tokenplan">
                        {intl.formatMessage({ id: "settings.asr.xiaomiMimo.billing.tokenplan" })}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                }
              />
            </>
          )}
          {textInput("settings.asr.language", draft.language, (v) => patch({ language: v }), {
            placeholder: "zh",
            descriptionId: "settings.asr.languageDescription",
          })}
          {textInput(
            "settings.asr.hotwords",
            draft.hotwords.join(", "),
            (v) =>
              patch({
                hotwords: v
                  .split(/[,，]/)
                  .map((word) => word.trim())
                  .filter(Boolean),
              }),
            {
              placeholder: "SilverKorali, Skcode",
              descriptionId: "settings.asr.hotwordsDescription",
            },
          )}
          <SettingsRow
            label={intl.formatMessage({ id: "settings.asr.save" })}
            description={intl.formatMessage({ id: "settings.asr.saveDescription" })}
            control={
              <div className="flex items-center gap-2">
                <Button type="button" size="lg" onClick={handleSave}>
                  {intl.formatMessage({ id: "settings.asr.save" })}
                </Button>
                <Button type="button" size="lg" variant="outline" onClick={handleRemove}>
                  {intl.formatMessage({ id: "settings.asr.remove" })}
                </Button>
              </div>
            }
          />
        </>
      ) : null}
    </SettingsGroupCard>
  );
}
