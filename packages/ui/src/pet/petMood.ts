import type { PetMoodAssetKey } from "@skcode/shared";
import type { SessionPhase } from "@skcode/shared/skcode-protocol-v4";

/**
 * 2D 宠物的情绪状态；语义与优先级见 specs/pet-system.md。
 * `greet` / `sleepy` 是纯本地表现态（挂载迎接 / 空闲犯困），
 * `derivePetMood` 不会返回它们，由组件层叠加在快照情绪之上。
 */
export type PetMood =
  | "idle"
  | "thinking"
  | "working"
  | "permission"
  | "question"
  | "error"
  | "done"
  | "greet"
  | "sleepy";

export interface PetMoodInput {
  phase: SessionPhase | null | undefined;
  /** snapshot.pendingInteractions 的 kind 列表（permission / userInput / workspaceHookReview）。 */
  pendingKinds: readonly string[];
  /** 会话级错误（control.lastError 或 phase === "error"）。 */
  hasError: boolean;
}

/**
 * 从会话快照推导宠物情绪。纯函数、无本地状态：
 * 快照是唯一事实来源，权限/提问优先于错误（用户正被阻塞是最需要注意的信号）。
 */
export function derivePetMood(input: PetMoodInput): PetMood {
  if (input.pendingKinds.includes("permission")) {
    return "permission";
  }
  if (input.pendingKinds.includes("userInput")) {
    return "question";
  }
  if (input.hasError) {
    return "error";
  }
  if (input.phase === "prewarming") {
    return "thinking";
  }
  if (input.phase === "running") {
    return "working";
  }
  if (input.phase === "completedSuccess") {
    return "done";
  }
  return "idle";
}

/** 情绪 → v5 扩展资产 key 的映射；idle/working 用基础位。 */
export const MOOD_ASSET_KEY: Partial<Record<PetMood, PetMoodAssetKey>> = {
  greet: "greet",
  done: "celebrate",
  error: "sad",
  thinking: "thinking",
  permission: "asking",
  question: "puzzled",
  sleepy: "sleepy",
};
