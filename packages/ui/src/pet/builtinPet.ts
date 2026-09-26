import type { PetAsset } from "@/pet/useUserPetPack.js";
import type { PetMood } from "@/pet/petMood.js";
import idleImageUrl from "@/assets/pet/silverkorali-idle.png";
import workingImageUrl from "@/assets/pet/silverkorali-working.png";
import idleLoopUrl from "@/assets/pet/silverkorali-idle-loop.webp";
import workLoopUrl from "@/assets/pet/silverkorali-working-loop.webp";
import thinkingImageUrl from "@/assets/pet/silverkorali-thinking.png";
import thinkingLoopUrl from "@/assets/pet/silverkorali-thinking-loop.webp";
import askingImageUrl from "@/assets/pet/silverkorali-asking.png";
import askingLoopUrl from "@/assets/pet/silverkorali-asking-loop.webp";
import puzzledImageUrl from "@/assets/pet/silverkorali-puzzled.png";
import puzzledLoopUrl from "@/assets/pet/silverkorali-puzzled-loop.webp";
import sadImageUrl from "@/assets/pet/silverkorali-sad.png";
import sadLoopUrl from "@/assets/pet/silverkorali-sad-loop.webp";
import celebrateImageUrl from "@/assets/pet/silverkorali-celebrate.png";
import celebrateLoopUrl from "@/assets/pet/silverkorali-celebrate-loop.webp";
import greetImageUrl from "@/assets/pet/silverkorali-greet.png";
import greetLoopUrl from "@/assets/pet/silverkorali-greet-loop.webp";
import sleepyImageUrl from "@/assets/pet/silverkorali-sleepy.png";
import sleepyLoopUrl from "@/assets/pet/silverkorali-sleepy-loop.webp";

export const BUILTIN_CHATTER_LINE_IDS = [
  "pet.line.1",
  "pet.line.2",
  "pet.line.3",
  "pet.line.4",
  "pet.line.5",
  "pet.line.6",
  "pet.line.7",
  "pet.line.8",
  "pet.line.9",
  "pet.line.10",
  "pet.line.11",
  "pet.line.12",
] as const;

export const BUILTIN_PET_LINE_IDS = [
  "pet.petline.1",
  "pet.petline.2",
  "pet.petline.3",
  "pet.petline.4",
  "pet.petline.5",
  "pet.petline.6",
  "pet.petline.7",
  "pet.petline.8",
] as const;

export const BUILTIN_DIZZY_LINE_IDS = [
  "pet.petline.dizzy1",
  "pet.petline.dizzy2",
  "pet.petline.dizzy3",
] as const;

export const BUILTIN_GREET_LINE_IDS = [
  "pet.greet.1",
  "pet.greet.2",
  "pet.greet.3",
  "pet.greet.4",
] as const;

/** 情绪气泡随机池（i18n id）；null=该情绪无气泡。 */
const MOOD_BUBBLE_LINE_IDS: Partial<Record<PetMood, readonly string[]>> = {
  thinking: ["pet.mood.thinking.1", "pet.mood.thinking.2", "pet.mood.thinking.3"],
  working: ["pet.mood.working.1", "pet.mood.working.2", "pet.mood.working.3"],
  permission: ["pet.mood.permission.1", "pet.mood.permission.2", "pet.mood.permission.3"],
  question: ["pet.mood.question.1", "pet.mood.question.2", "pet.mood.question.3"],
  error: ["pet.mood.error.1", "pet.mood.error.2", "pet.mood.error.3"],
  done: ["pet.mood.done.1", "pet.mood.done.2", "pet.mood.done.3"],
  greet: [...BUILTIN_GREET_LINE_IDS],
};

export interface PetVisual {
  asset: PetAsset;
  /** 视频不可用（reduced-motion / 加载失败）时的静态图 CSS 动画。 */
  animation: string;
  /** 该情绪的台词池（i18n id）；null=不冒气泡。 */
  bubbleLineIds: readonly string[] | null;
  /** done/greet 的气泡是限时的，其余状态持续显示。 */
  transientBubble: boolean;
}

/** 内置 SilverKorali 的情绪视觉表；用户包在渲染层按同构形状动态生成。 */
export const BUILTIN_MOOD_VISUALS: Record<PetMood, PetVisual> = {
  idle: {
    asset: { image: idleImageUrl, video: idleLoopUrl },
    animation: "skcode-pet-float",
    bubbleLineIds: null,
    transientBubble: false,
  },
  thinking: {
    asset: { image: thinkingImageUrl, video: thinkingLoopUrl },
    animation: "skcode-pet-float",
    bubbleLineIds: MOOD_BUBBLE_LINE_IDS.thinking ?? null,
    transientBubble: false,
  },
  working: {
    asset: { image: workingImageUrl, video: workLoopUrl },
    animation: "skcode-pet-sway",
    bubbleLineIds: MOOD_BUBBLE_LINE_IDS.working ?? null,
    transientBubble: false,
  },
  permission: {
    asset: { image: askingImageUrl, video: askingLoopUrl },
    animation: "skcode-pet-bounce",
    bubbleLineIds: MOOD_BUBBLE_LINE_IDS.permission ?? null,
    transientBubble: false,
  },
  question: {
    asset: { image: puzzledImageUrl, video: puzzledLoopUrl },
    animation: "skcode-pet-bounce",
    bubbleLineIds: MOOD_BUBBLE_LINE_IDS.question ?? null,
    transientBubble: false,
  },
  error: {
    asset: { image: sadImageUrl, video: sadLoopUrl },
    animation: "skcode-pet-shake",
    bubbleLineIds: MOOD_BUBBLE_LINE_IDS.error ?? null,
    transientBubble: false,
  },
  done: {
    asset: { image: celebrateImageUrl, video: celebrateLoopUrl },
    animation: "skcode-pet-hop",
    bubbleLineIds: MOOD_BUBBLE_LINE_IDS.done ?? null,
    transientBubble: true,
  },
  greet: {
    asset: { image: greetImageUrl, video: greetLoopUrl },
    animation: "skcode-pet-bounce",
    bubbleLineIds: MOOD_BUBBLE_LINE_IDS.greet ?? null,
    transientBubble: true,
  },
  sleepy: {
    asset: { image: sleepyImageUrl, video: sleepyLoopUrl },
    animation: "skcode-pet-float",
    bubbleLineIds: null,
    transientBubble: false,
  },
};
