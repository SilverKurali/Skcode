import type { Locale } from "@skcode/shared";
import { memo, useCallback, useEffect, useState } from "react";
import { DesktopCommandIds, TID_LOGIN_TRIGGER, TID_TASK_SETTINGS_BUTTON } from "@skcode/shared";
import {
  Compass,
  Globe,
  Maximize,
  Palette,
  PencilRuler,
  Settings,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { ControlHintTooltip } from "@/ControlHintTooltip.js";
import { cn } from "@/components/lib/utils.js";
import { Button } from "@/components/ui/button.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.js";
import { usePlatform } from "@/hooks/usePlatform.js";
import { useSkcodeIntl } from "@/i18n/IntlProvider.js";
import { useShortcutCommandLabel } from "@/shortcuts/useShortcutBindings.js";
import { useSkcodeStore } from "@/store/StoreProvider.js";
import { normalizeInterfaceMode } from "@/lib/interfaceMode.js";
import type { Theme } from "@/useTheme.js";
import { WorkspaceWebRemoteControlTrigger } from "@/WorkspaceWebRemoteControlTrigger.js";
import { WorkspaceSidebarFooterUsageSummaryContent } from "@/WorkspaceSidebarFooterUsageSummary.js";

const DESKTOP_ZOOM_MIN_LEVEL = -3;
const DESKTOP_ZOOM_MAX_LEVEL = 5;

export const WorkspaceSidebarFooter = memo(function WorkspaceSidebarFooterComponent({
  theme,
  localeMenuValue,
  onLocaleChange,
  onThemeChange,
  onSettingsButtonClick,
  onUsageClick,
  settingsButtonMode = "settings",
  workspacePath,
  workspaceIdentity,
  isDesktop = false,
  className,
}: {
  theme: Theme;
  localeMenuValue: Locale | "system";
  onLocaleChange: (value: string) => void;
  onThemeChange: (value: string) => void;
  onSettingsButtonClick?: () => void;
  onUsageClick?: () => void;
  settingsButtonMode?: "settings" | "back";
  workspacePath?: string;
  workspaceIdentity?: string;
  isDesktop?: boolean;
  className?: string;
}) {
  const { intl } = useSkcodeIntl();
  const platform = usePlatform();
  const interfaceMode = useSkcodeStore((state) => state.interfaceMode);
  const setInterfaceMode = useSkcodeStore((state) => state.setInterfaceMode);
  const zoomInShortcutLabel = useShortcutCommandLabel("zoomIn");
  const zoomOutShortcutLabel = useShortcutCommandLabel("zoomOut");
  const resetZoomShortcutLabel = useShortcutCommandLabel("resetZoom");
  const settingsButtonLabel =
    settingsButtonMode === "back"
      ? intl.formatMessage({ id: "workspace.backToWorkspace" })
      : intl.formatMessage({ id: "settings.title" });
  const usageButtonClick = onUsageClick ?? onSettingsButtonClick;
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [desktopZoomLevel, setDesktopZoomLevel] = useState(0);
  const runDesktopZoomCommand = useCallback(
    (command: (typeof DesktopCommandIds)["ZoomIn" | "ZoomOut" | "ResetZoom"]) => {
      void platform.executeDesktopCommand(command);
    },
    [platform],
  );

  useEffect(() => {
    if (!isDesktop) {
      setDesktopZoomLevel(0);
      return;
    }

    let isCancelled = false;
    void platform.getDesktopZoomLevel?.().then((state) => {
      if (!isCancelled && Number.isFinite(state.zoomLevel)) {
        setDesktopZoomLevel(state.zoomLevel);
      }
    });

    const dispose = platform.onDesktopZoomLevelChanged?.((state) => {
      if (Number.isFinite(state.zoomLevel)) {
        setDesktopZoomLevel(state.zoomLevel);
      }
    });

    return () => {
      isCancelled = true;
      dispose?.();
    };
  }, [isDesktop, platform]);

  const canResetDesktopZoom = desktopZoomLevel !== 0;
  const canZoomIn = desktopZoomLevel < DESKTOP_ZOOM_MAX_LEVEL;
  const canZoomOut = desktopZoomLevel > DESKTOP_ZOOM_MIN_LEVEL;

  return (
    // footer 被 Settings 复用，页面专属边距由调用方传入，避免修改共享默认样式。
    <footer className={cn("flex shrink-0 flex-col gap-2.5 px-4 pt-2 pb-4", className)}>
      <div className="flex min-w-0 gap-2">
        <DropdownMenu open={profileMenuOpen} onOpenChange={setProfileMenuOpen}>
          <DropdownMenuTrigger asChild>
            {/* BYOK 无账号形态：不做身份展示，入口承载界面偏好与用量统计。
                新建任务/自动化/插件市场/设置与左侧边栏重复，不在此处重复提供。 */}
            <Button
              type="button"
              variant="ghost"
              size={"lg"}
              className="min-w-0 flex-1 justify-start gap-2 overflow-hidden rounded-tl-2xl rounded-bl-2xl border-0 pl-0"
              data-testid={TID_LOGIN_TRIGGER}
              aria-label={intl.formatMessage({ id: "sidebar.footer.quickNav" })}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-background">
                <Compass className="size-4" />
              </span>
              <span className="min-w-0 flex-1 overflow-hidden text-left">
                <span className="block truncate text-ui-base font-semibold text-foreground">
                  {intl.formatMessage({ id: "sidebar.footer.quickNav" })}
                </span>
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-max min-w-50" forceMount>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Globe className="size-4" />
                {intl.formatMessage({ id: "settings.locale" })}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-48">
                <DropdownMenuRadioGroup value={localeMenuValue} onValueChange={onLocaleChange}>
                  <DropdownMenuRadioItem value="system">
                    {intl.formatMessage({
                      id: "sidebar.settings.systemDefault",
                    })}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="en-US">
                    {intl.formatMessage({
                      id: "sidebar.settings.locale.en-US",
                    })}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="zh-CN">
                    {intl.formatMessage({
                      id: "sidebar.settings.locale.zh-CN",
                    })}
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Palette className="size-4" />
                {intl.formatMessage({ id: "settings.themeMode" })}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-48">
                <DropdownMenuRadioGroup value={theme} onValueChange={onThemeChange}>
                  <DropdownMenuRadioItem value="system">
                    {intl.formatMessage({
                      id: "sidebar.settings.systemDefault",
                    })}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="zai-dark">
                    {intl.formatMessage({
                      id: "sidebar.settings.theme.zai-dark",
                    })}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="zai-light">
                    {intl.formatMessage({
                      id: "sidebar.settings.theme.zai-light",
                    })}
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <PencilRuler className="size-4" />
                {intl.formatMessage({ id: "settings.interfaceMode" })}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-48">
                <DropdownMenuRadioGroup
                  value={interfaceMode}
                  onValueChange={(value) => setInterfaceMode(normalizeInterfaceMode(value))}
                >
                  <DropdownMenuRadioItem value="coding">
                    {intl.formatMessage({ id: "settings.interfaceMode.coding" })}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="office">
                    {intl.formatMessage({ id: "settings.interfaceMode.office" })}
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            {/* 界面缩放仅桌面端（Web 由浏览器自身缩放）。快捷键 label 读生效表，设置页改绑后即时跟随。 */}
            {isDesktop ? (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <ZoomIn className="size-4" />
                  {intl.formatMessage({ id: "sidebar.settings.interfaceZoom" })}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-50">
                  <DropdownMenuItem
                    disabled={!canZoomIn}
                    onSelect={() => runDesktopZoomCommand(DesktopCommandIds.ZoomIn)}
                  >
                    <ZoomIn className="size-4" />
                    {intl.formatMessage({ id: "titleBar.menu.view.zoomIn" })}
                    <DropdownMenuShortcut>{zoomInShortcutLabel}</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={!canZoomOut}
                    onSelect={() => runDesktopZoomCommand(DesktopCommandIds.ZoomOut)}
                  >
                    <ZoomOut className="size-4" />
                    {intl.formatMessage({ id: "titleBar.menu.view.zoomOut" })}
                    <DropdownMenuShortcut>{zoomOutShortcutLabel}</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={!canResetDesktopZoom}
                    onSelect={() => runDesktopZoomCommand(DesktopCommandIds.ResetZoom)}
                  >
                    <Maximize className="size-4" />
                    {intl.formatMessage({ id: "titleBar.menu.view.actualSize" })}
                    <DropdownMenuShortcut>{resetZoomShortcutLabel}</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            ) : null}
            {/* 使用统计（本地会话/用量）；套餐升级入口已按 BYOK 边界移除。*/}
            <WorkspaceSidebarFooterUsageSummaryContent
              onUsageClick={() => {
                if (usageButtonClick) {
                  setProfileMenuOpen(false);
                  usageButtonClick();
                }
              }}
            />
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex shrink-0 items-center gap-1.5">
          {isDesktop && workspacePath ? (
            <WorkspaceWebRemoteControlTrigger
              workspacePath={workspacePath}
              workspaceIdentity={workspaceIdentity}
              compact
            />
          ) : null}
          <ControlHintTooltip title={settingsButtonLabel}>
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              data-testid={TID_TASK_SETTINGS_BUTTON}
              aria-label={settingsButtonLabel}
              disabled={!onSettingsButtonClick}
              onClick={onSettingsButtonClick}
            >
              <Settings className="size-4" />
            </Button>
          </ControlHintTooltip>
        </div>
      </div>
    </footer>
  );
});
