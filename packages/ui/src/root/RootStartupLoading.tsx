import type { ReactNode } from "react";
import { cn } from "@/components/lib/utils.js";
import skcodeAppIconUrl from "@/assets/skcode-app-icon.png";

interface RootStartupLoadingProps {
  label: string;
  children?: ReactNode;
  busy?: boolean;
}

export function RootStartupLoading({ label, children, busy = true }: RootStartupLoadingProps) {
  return (
    <div
      // Web 端全局 html/body/#root 为 Electron 透明背景让路，React 接管后会替换 HTML 启动壳。
      // 这里必须由阻塞态自身承接主题背景，否则远控链接会在 Root 恢复期间继续露出浏览器白底。
      className="flex h-full min-h-dvh flex-col items-center justify-center gap-6 bg-background text-foreground"
      role="status"
      aria-busy={busy}
      aria-label={label}
      data-testid="root-startup-loading"
    >
      <SkcodeStartupLogoBadge />
      {children}
    </div>
  );
}

/** 初始化与引导共用品牌图标：直接展示 App 图标（紫色圆角方块 S），与全应用身份一致。 */
export function SkcodeStartupLogoBadge({ animated = true }: { animated?: boolean }) {
  return (
    <img
      src={skcodeAppIconUrl}
      alt=""
      draggable={false}
      className={cn("size-24 select-none rounded-3xl shadow-xl/20", animated && "animate-pulse")}
    />
  );
}
