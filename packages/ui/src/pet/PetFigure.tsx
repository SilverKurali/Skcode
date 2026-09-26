/**
 * Skcode 宠物立绘渲染：动态 WebP（内置包，<img> 自动播放）或
 * 带 alpha 的 WebM（用户包，<video>），失败/减少动态时回退静态图 + CSS 动画。
 */
import type { CSSProperties } from "react";
import { cn } from "@/components/lib/utils.js";
import type { PetAsset } from "@/pet/useUserPetPack.js";

export function PetFigure({
  asset,
  reducedMotion,
  broken,
  onBroken,
  sizePx,
  animationClass,
  cacheKey,
}: {
  asset: PetAsset;
  reducedMotion: boolean;
  broken: boolean;
  onBroken: () => void;
  /** 显示高度（px），来自宠物大小设置。 */
  sizePx: number;
  /** 静态图上的 CSS 动画 class。 */
  animationClass: string;
  /** 包 id + 情绪，切换时强制重载动效。 */
  cacheKey: string;
}) {
  const style = { "--skcode-pet-size": `${sizePx}px` } as CSSProperties;
  const sizeClass =
    "h-[var(--skcode-pet-size)] select-none @max-[640px]/conversation:h-[min(var(--skcode-pet-size),144px)]";
  const motionUrl = asset.video;
  const useMotion = Boolean(motionUrl) && !reducedMotion && !broken;
  const motionIsImage = motionUrl?.toLowerCase().endsWith(".webp") ?? false;

  if (useMotion && motionIsImage) {
    return (
      <img
        key={cacheKey}
        src={motionUrl}
        alt=""
        draggable={false}
        onError={onBroken}
        style={style}
        className={cn(sizeClass, animationClass)}
      />
    );
  }
  if (useMotion) {
    return (
      <video
        key={cacheKey}
        src={motionUrl}
        autoPlay
        loop
        muted
        playsInline
        disablePictureInPicture
        aria-hidden="true"
        draggable={false}
        onError={onBroken}
        style={style}
        className={sizeClass}
      />
    );
  }
  return (
    <img
      key={cacheKey}
      src={asset.image}
      alt=""
      draggable={false}
      style={style}
      className={cn(sizeClass, animationClass)}
    />
  );
}
