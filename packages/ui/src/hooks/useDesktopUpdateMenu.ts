import { DesktopCommandIds, type UpdateStatePayload } from "@skcode/shared";
import { useEffect, useState } from "react";
import { usePlatform } from "@/hooks/usePlatform.js";
import {
  getUpdateMenuLabelId,
  getUpdateMenuLabelValues,
  shouldShowDesktopUpdateEntry,
} from "@/lib/desktopUpdateMenu.js";
import { logger } from "@/logger.js";

export function useDesktopUpdateMenu(isDesktop: boolean) {
  const platform = usePlatform();
  const [state, setState] = useState<UpdateStatePayload | null>(null);

  useEffect(() => {
    if (!isDesktop) return;
    let active = true;
    let eventReceived = false;
    // main 持有更新状态；先订阅，避免较慢的初始快照覆盖已经收到的新状态。
    const dispose = platform.onUpdateStateChanged?.((payload) => {
      eventReceived = true;
      if (active) setState(payload);
    });
    void platform.getUpdateState?.().then(
      (payload) => {
        if (active && !eventReceived) setState(payload);
      },
      (error) => logger.warn("[HelpMenu] 同步自动更新状态失败", { error }),
    );
    return () => {
      active = false;
      dispose?.();
    };
  }, [platform, isDesktop]);

  // 可见性以主进程状态为准：更新系统未启用（enabled:false，Skcode 默认如此）或
  // 状态尚未同步时隐藏入口，避免「检查更新」成为点击无反应的死菜单项。
  const visible = isDesktop && shouldShowDesktopUpdateEntry() && state?.enabled === true;

  return {
    visible,
    disabled: state?.enabled === false,
    labelId: getUpdateMenuLabelId(state),
    labelValues: getUpdateMenuLabelValues(state),
    checkForUpdates: () => {
      void platform.executeDesktopCommand(DesktopCommandIds.CheckForUpdates);
    },
  };
}
