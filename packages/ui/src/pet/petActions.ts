/**
 * Skcode 宠物的动作池与点击判定。动作 = 命名 CSS 动画 + 时长，
 * 播放器在 SilverKoraliPet；这里只做可测试的纯逻辑。
 */

export interface PetAction {
  /** 稳定 id，用于调试与测试断言 */
  id: string;
  /** styles.css 里的动画 class（前缀 skcode-pet-） */
  className: string;
  /** 一次播放时长；播完调度器才回待机 */
  durationMs: number;
}

/** 空闲小动作池：待机时随机轮播，让立绘"活着"。 */
export const IDLE_ACTIONS: readonly PetAction[] = [
  { id: "tilt", className: "skcode-pet-tilt", durationMs: 2200 },
  { id: "stretch", className: "skcode-pet-stretch", durationMs: 1800 },
  { id: "hop", className: "skcode-pet-hop", durationMs: 900 },
  { id: "wiggle", className: "skcode-pet-wiggle", durationMs: 1300 },
  { id: "nod", className: "skcode-pet-nod", durationMs: 1400 },
];

/** 被摸（点击）时的反应动作池。 */
export const PET_ACTIONS: readonly PetAction[] = [
  { id: "pet-hop", className: "skcode-pet-pet-hop", durationMs: 850 },
  { id: "pet-bounce", className: "skcode-pet-pet-bounce", durationMs: 700 },
  { id: "pet-wiggle", className: "skcode-pet-pet-wiggle", durationMs: 900 },
  { id: "pet-twirl", className: "skcode-pet-pet-twirl", durationMs: 1100 },
];

/** 罕见特别反应：开心到原地转圈（触发时同步撒星星）。 */
export const PET_SPECIAL_ACTION: PetAction = {
  id: "pet-spin",
  className: "skcode-pet-pet-spin",
  durationMs: 1300,
};

/** 普通点击触发特别反应的概率。 */
export const PET_SPECIAL_CHANCE = 0.08;

/** 连点过快的"晕头转向"反应。 */
export const DIZZY_ACTION: PetAction = {
  id: "pet-dizzy",
  className: "skcode-pet-pet-dizzy",
  durationMs: 1400,
};

/** 连点判定窗口与阈值（窗口内 ≥ 阈值次 → 晕）。 */
export const PET_CLICK_WINDOW_MS = 2500;
export const PET_DIZZY_CLICK_COUNT = 5;

export function pickAction<T>(pool: readonly T[], rng: () => number = Math.random): T {
  return pool[Math.floor(rng() * pool.length)] as T;
}

/**
 * 根据最近的点击时间序列判定反应：窗口内连点过多 → 晕头转向，否则普通宠物反应。
 * 纯函数：时间来源由调用方注入。
 */
export function resolvePetReaction(
  clickTimestamps: readonly number[],
  now: number,
): { dizzy: boolean; recentClickCount: number } {
  const recentClickCount = clickTimestamps.filter(
    (t) => t <= now && now - t <= PET_CLICK_WINDOW_MS,
  ).length;
  return { dizzy: recentClickCount >= PET_DIZZY_CLICK_COUNT, recentClickCount };
}
