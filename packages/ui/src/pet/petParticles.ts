/**
 * Skcode 宠物的粒子特效（爱心/星星/Zzz）：纯表现层，
 * 生成与回收都在这里，组件只负责渲染。见 specs/pet-system.md v5。
 */
import { useCallback, useEffect, useRef, useState } from "react";

export type ParticleKind = "heart" | "star" | "zzz";

export interface PetParticle {
  id: number;
  kind: ParticleKind;
  /** 相对立绘锚点的水平偏移百分比，避免完全重叠。 */
  offsetXPercent: number;
  /** 粒子间的启动延迟（ms），让成组粒子有节奏感。 */
  delayMs: number;
}

/** 粒子存活时长（与 styles.css 动画时长一致）。 */
const PARTICLE_LIFETIME: Record<ParticleKind, number> = {
  heart: 1200,
  star: 1400,
  zzz: 2400,
};

/**
 * 粒子发射器。`enabled` 关闭（特效开关/减少动态效果）时不生成新粒子；
 * 返回的 spawnParticles 是稳定引用，可作为 effect 依赖。
 */
export function usePetParticles(enabled: boolean): {
  particles: PetParticle[];
  spawnParticles: (kind: ParticleKind, count: number) => void;
} {
  const [particles, setParticles] = useState<PetParticle[]>([]);
  const seqRef = useRef(0);
  const timersRef = useRef<number[]>([]);

  const spawnParticles = useCallback(
    (kind: ParticleKind, count: number) => {
      if (!enabled) {
        return;
      }
      const lifetime = PARTICLE_LIFETIME[kind];
      const spawned = Array.from({ length: count }, (_, index) => {
        seqRef.current += 1;
        return {
          id: seqRef.current,
          kind,
          offsetXPercent: Math.round(Math.random() * 36 - 18),
          delayMs: index * 120,
        };
      });
      setParticles((prev) => [...prev, ...spawned]);
      for (const particle of spawned) {
        const timer = window.setTimeout(() => {
          setParticles((prev) => prev.filter((p) => p.id !== particle.id));
        }, lifetime + particle.delayMs);
        timersRef.current.push(timer);
      }
    },
    [enabled],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  return { particles, spawnParticles };
}
