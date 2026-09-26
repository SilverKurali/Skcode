import { useCallback, useEffect, useState } from "react";
import { LocateFixedIcon, RefreshCwIcon, SparklesIcon } from "lucide-react";
import { BUILTIN_PET_PACK_ID } from "@skcode/shared";
import type { PetPackSummary } from "@skcode/shared";
import { Button } from "@/components/ui/button.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.js";
import { Switch } from "@/components/ui/switch.js";
import { SettingsRow } from "@/settings/SettingsPageParts.js";
import { usePlatform } from "@/hooks/usePlatform.js";
import { useSkcodeIntl } from "@/i18n/IntlProvider.js";
import { PET_SIZE_MAX, PET_SIZE_MIN } from "@/store/petPreferences.js";
import { useSkcodeStoreWithDefault } from "@/store/StoreProvider.js";

export function PetMascotSetting({
  onCreatePetTask,
}: {
  /** 发起「用 AI 创建宠物」脚手架任务；未提供（如静态渲染）时隐藏按钮。 */
  onCreatePetTask?: (prompt: string) => void;
}) {
  const { intl } = useSkcodeIntl();
  const platform = usePlatform();
  const petMascotEnabled = useSkcodeStoreWithDefault((state) => state.petMascotEnabled, false);
  const setPetMascotEnabled = useSkcodeStoreWithDefault(
    (state) => state.setPetMascotEnabled,
    () => {},
  );
  const petPackId = useSkcodeStoreWithDefault((state) => state.petPackId, BUILTIN_PET_PACK_ID);
  const setPetPackId = useSkcodeStoreWithDefault(
    (state) => state.setPetPackId,
    () => {},
  );
  // v5 偏好：大小 / 气泡台词 / 互动特效 / 拖拽位置。
  const petSize = useSkcodeStoreWithDefault((state) => state.petSize, 224);
  const setPetSize = useSkcodeStoreWithDefault(
    (state) => state.setPetSize,
    () => {},
  );
  const petBubblesEnabled = useSkcodeStoreWithDefault((state) => state.petBubblesEnabled, true);
  const setPetBubblesEnabled = useSkcodeStoreWithDefault(
    (state) => state.setPetBubblesEnabled,
    () => {},
  );
  const petEffectsEnabled = useSkcodeStoreWithDefault((state) => state.petEffectsEnabled, true);
  const setPetEffectsEnabled = useSkcodeStoreWithDefault(
    (state) => state.setPetEffectsEnabled,
    () => {},
  );
  const setPetPosition = useSkcodeStoreWithDefault(
    (state) => state.setPetPosition,
    () => {},
  );

  const [userPacks, setUserPacks] = useState<PetPackSummary[]>([]);
  const [rescanning, setRescanning] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    if (!petMascotEnabled) {
      return;
    }
    let cancelled = false;
    setRescanning(true);
    void platform
      .listPetPacks?.()
      .then((result) => {
        if (!cancelled) {
          setUserPacks(result?.packs ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUserPacks([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setRescanning(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [platform, petMascotEnabled, reloadTick]);

  const handleRescan = useCallback(() => {
    setReloadTick((tick) => tick + 1);
  }, []);

  const handleCreateWithAi = useCallback(() => {
    onCreatePetTask?.(intl.formatMessage({ id: "settings.petSystem.aiPrompt" }));
  }, [intl, onCreatePetTask]);

  return (
    <>
      <SettingsRow
        label={intl.formatMessage({ id: "settings.petSystem" })}
        description={intl.formatMessage({ id: "settings.petSystem.description" })}
        control={
          <Switch
            checked={petMascotEnabled}
            onCheckedChange={setPetMascotEnabled}
            aria-label={intl.formatMessage({ id: "settings.petSystem" })}
          />
        }
      />
      {petMascotEnabled ? (
        <SettingsRow
          label={intl.formatMessage({ id: "settings.petSystem.pack" })}
          description={intl.formatMessage({ id: "settings.petSystem.packDescription" })}
          control={
            <Select value={petPackId} onValueChange={setPetPackId}>
              <SelectTrigger
                size="lg"
                className="w-full min-w-0 sm:w-64"
                aria-label={intl.formatMessage({ id: "settings.petSystem.pack" })}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={BUILTIN_PET_PACK_ID}>
                  {intl.formatMessage({ id: "settings.petSystem.builtinPack" })}
                </SelectItem>
                {userPacks.map((pack) => (
                  <SelectItem key={pack.id} value={pack.id}>
                    {pack.name}
                    {pack.author ? ` (${pack.author})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
          detail={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="lg"
                variant="outline"
                disabled={rescanning}
                onClick={handleRescan}
              >
                <RefreshCwIcon className="size-4" />
                {intl.formatMessage({ id: "settings.petSystem.rescan" })}
              </Button>
              {onCreatePetTask ? (
                <Button type="button" size="lg" onClick={handleCreateWithAi}>
                  <SparklesIcon className="size-4" />
                  {intl.formatMessage({ id: "settings.petSystem.aiCreate" })}
                </Button>
              ) : null}
            </div>
          }
        />
      ) : null}
      {petMascotEnabled ? (
        <>
          <SettingsRow
            label={intl.formatMessage({ id: "settings.petSystem.size" })}
            description={intl.formatMessage({ id: "settings.petSystem.sizeDescription" })}
            control={
              <div className="flex w-full max-w-72 items-center gap-3 sm:w-64">
                <input
                  type="range"
                  min={PET_SIZE_MIN}
                  max={PET_SIZE_MAX}
                  step={8}
                  value={petSize}
                  onChange={(event) => setPetSize(Number(event.target.value))}
                  aria-label={intl.formatMessage({ id: "settings.petSystem.size" })}
                  className="h-1.5 w-full cursor-pointer accent-primary"
                />
                <span className="w-12 text-right text-ui-caption tabular-nums text-muted-foreground">
                  {petSize}px
                </span>
              </div>
            }
            detail={
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={() => setPetPosition(null)}
              >
                <LocateFixedIcon className="size-4" />
                {intl.formatMessage({ id: "settings.petSystem.resetPosition" })}
              </Button>
            }
          />
          <SettingsRow
            label={intl.formatMessage({ id: "settings.petSystem.bubbles" })}
            description={intl.formatMessage({ id: "settings.petSystem.bubblesDescription" })}
            control={
              <Switch
                checked={petBubblesEnabled}
                onCheckedChange={setPetBubblesEnabled}
                aria-label={intl.formatMessage({ id: "settings.petSystem.bubbles" })}
              />
            }
          />
          <SettingsRow
            label={intl.formatMessage({ id: "settings.petSystem.effects" })}
            description={intl.formatMessage({ id: "settings.petSystem.effectsDescription" })}
            control={
              <Switch
                checked={petEffectsEnabled}
                onCheckedChange={setPetEffectsEnabled}
                aria-label={intl.formatMessage({ id: "settings.petSystem.effects" })}
              />
            }
          />
        </>
      ) : null}
    </>
  );
}
