/**
 * Skcode 宠物渲染偏好（大小/气泡/特效/拖拽位置）。
 * 全部是每窗口本地 localStorage 偏好，不进 BROADCAST_FIELDS（避免回环）。
 */
import { readSafeLocalStorage, writeSafeLocalStorage } from "@/lib/browserEnvironment.js";

const PET_SIZE_STORAGE_KEY = "skcode-pet-size";
const PET_BUBBLES_STORAGE_KEY = "skcode-pet-bubbles";
const PET_EFFECTS_STORAGE_KEY = "skcode-pet-effects";
const PET_POSITION_STORAGE_KEY = "skcode-pet-pos";

/** 宠物立绘显示高度（px）边界与默认值（v5 大小调节）。 */
export const PET_SIZE_MIN = 112;
export const PET_SIZE_MAX = 320;
export const PET_SIZE_DEFAULT = 224;

/** 宠物拖拽位置：相对会话容器的右/下边距（px）。 */
export interface PetPosition {
  right: number;
  bottom: number;
}

export function normalizePetSize(size: number): number {
  return Math.min(PET_SIZE_MAX, Math.max(PET_SIZE_MIN, Math.round(size)));
}

export function loadPetSize(): number {
  const raw = Number(readSafeLocalStorage(PET_SIZE_STORAGE_KEY));
  if (!Number.isFinite(raw) || raw <= 0) {
    return PET_SIZE_DEFAULT;
  }
  return normalizePetSize(raw);
}

export function persistPetSize(size: number): void {
  writeSafeLocalStorage(PET_SIZE_STORAGE_KEY, String(size));
}

export function loadPetBubblesEnabled(): boolean {
  return readSafeLocalStorage(PET_BUBBLES_STORAGE_KEY) !== "false";
}

export function persistPetBubbles(enabled: boolean): void {
  writeSafeLocalStorage(PET_BUBBLES_STORAGE_KEY, enabled ? "true" : "false");
}

export function loadPetEffectsEnabled(): boolean {
  return readSafeLocalStorage(PET_EFFECTS_STORAGE_KEY) !== "false";
}

export function persistPetEffects(enabled: boolean): void {
  writeSafeLocalStorage(PET_EFFECTS_STORAGE_KEY, enabled ? "true" : "false");
}

export function loadPetPosition(): PetPosition | null {
  try {
    const raw = readSafeLocalStorage(PET_POSITION_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<PetPosition>;
    if (
      typeof parsed.right !== "number" ||
      typeof parsed.bottom !== "number" ||
      !Number.isFinite(parsed.right) ||
      !Number.isFinite(parsed.bottom)
    ) {
      return null;
    }
    return { right: Math.max(0, parsed.right), bottom: Math.max(0, parsed.bottom) };
  } catch {
    return null;
  }
}

export function persistPetPosition(position: PetPosition | null): void {
  writeSafeLocalStorage(PET_POSITION_STORAGE_KEY, position ? JSON.stringify(position) : "");
}
