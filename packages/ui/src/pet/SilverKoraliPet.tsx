import { useEffect, useMemo, useRef, useState } from "react";
import { Heart, Sparkle } from "lucide-react";
import type { ConversationSnapshot } from "@skcode/shared/skcode-protocol-v4";
import { BUILTIN_PET_PACK_ID } from "@skcode/shared";
import { cn } from "@/components/lib/utils.js";
import { useUserPetPack, type PetAsset } from "@/pet/useUserPetPack.js";
import { BUILTIN_MOOD_VISUALS } from "@/pet/builtinPet.js";
import {
  DIZZY_ACTION,
  IDLE_ACTIONS,
  PET_ACTIONS,
  PET_CLICK_WINDOW_MS,
  PET_SPECIAL_ACTION,
  PET_SPECIAL_CHANCE,
  pickAction,
  resolvePetReaction,
  type PetAction,
} from "@/pet/petActions.js";
import { usePetParticles } from "@/pet/petParticles.js";
import { usePetLines } from "@/pet/usePetLines.js";
import { usePetDrag } from "@/pet/usePetDrag.js";
import { MOOD_ASSET_KEY, derivePetMood, type PetMood } from "@/pet/petMood.js";
import { PetFigure } from "@/pet/PetFigure.js";
import { useSkcodeIntl } from "@/i18n/IntlProvider.js";
import { useSkcodeStoreWithDefault } from "@/store/StoreProvider.js";
import { PET_SIZE_DEFAULT } from "@/store/petPreferences.js";

/** 完成气泡展示时长；到期回到无气泡待机。 */
const DONE_BUBBLE_MS = 4000;
/** 挂载迎接（挥手）展示时长与启动延迟。 */
const GREET_DELAY_MS = 800;
const GREET_MS = 3600;
/** 空闲多久后进入犯困态。 */
const SLEEPY_AFTER_MS = 90000;
/** 空闲小动作的调度间隔（播放完成后到下一次动作之间）。 */
const IDLE_ACTION_MIN_DELAY_MS = 8000;
const IDLE_ACTION_MAX_DELAY_MS = 18000;
/** 随机搭话的调度间隔与气泡停留时长。 */
const CHATTER_MIN_DELAY_MS = 25000;
const CHATTER_MAX_DELAY_MS = 50000;
const CHATTER_LINE_MS = 4000;
/** 点击反应语出现概率；晕眩反应的冷却时间。 */
const PET_LINE_CHANCE = 0.3;
const DIZZY_COOLDOWN_MS = 4000;

export function SilverKoraliPet({ snapshot }: { snapshot: ConversationSnapshot | null }) {
  const { intl } = useSkcodeIntl();
  // 容错读开关：静态渲染/无 Provider 场景下默认隐藏，与「展示组件不触 store」约束一致。
  const enabled = useSkcodeStoreWithDefault((state) => state.petMascotEnabled, false);
  const packId = useSkcodeStoreWithDefault((state) => state.petPackId, BUILTIN_PET_PACK_ID);
  const userPack = useUserPetPack(enabled, packId);
  // 用户包加载失败/未就绪 → 回退内置视觉，避免空白或闪烁。
  const usingPack = userPack ?? null;
  // v5 偏好：大小 / 气泡 / 特效 / 拖拽位置。
  const petSize = useSkcodeStoreWithDefault((state) => state.petSize, PET_SIZE_DEFAULT);
  const bubblesEnabled = useSkcodeStoreWithDefault((state) => state.petBubblesEnabled, true);
  const effectsEnabled = useSkcodeStoreWithDefault((state) => state.petEffectsEnabled, true);
  const position = useSkcodeStoreWithDefault((state) => state.petPosition, null);
  const setPetPosition = useSkcodeStoreWithDefault(
    (state) => state.setPetPosition,
    () => {},
  );

  const mood = useMemo(
    () =>
      derivePetMood({
        phase: snapshot?.control.phase ?? null,
        pendingKinds: (snapshot?.pendingInteractions ?? []).map((interaction) => interaction.kind),
        hasError: snapshot?.control.phase === "error" || snapshot?.control.lastError != null,
      }),
    [snapshot],
  );

  // 减少动态效果：动画全被 CSS 关掉，调度器也没必要跑。
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  // ---- 本地表现态：迎接（一次性）/ 犯困（空闲计时），叠加在快照情绪之上 ----
  const [greetVisible, setGreetVisible] = useState(false);
  const [sleepy, setSleepy] = useState(false);
  const moodRef = useRef<PetMood>(mood);
  moodRef.current = mood;

  // 挂载迎接：短暂延迟后挥手打招呼（一次性；reduced-motion 与非空闲时跳过）。
  useEffect(() => {
    if (!enabled || reducedMotion) {
      return;
    }
    let hideTimer: number | undefined;
    const timer = window.setTimeout(() => {
      if (moodRef.current === "idle") {
        setGreetVisible(true);
        hideTimer = window.setTimeout(() => setGreetVisible(false), GREET_MS);
      }
    }, GREET_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
      if (hideTimer !== undefined) {
        window.clearTimeout(hideTimer);
      }
    };
    // 一次性：只在挂载时打招呼。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  useEffect(() => {
    if (!enabled || mood !== "idle") {
      setSleepy(false);
      return;
    }
    const timer = window.setTimeout(() => setSleepy(true), SLEEPY_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [enabled, mood]);

  const displayMood: PetMood =
    greetVisible && mood === "idle" ? "greet" : sleepy && mood === "idle" ? "sleepy" : mood;

  // ---- 宠物化本地状态（都是表现层，不承载会话事实） ----
  const [ambientAction, setAmbientAction] = useState<PetAction | null>(null);
  const [reactionAction, setReactionAction] = useState<PetAction | null>(null);
  const [petLine, setPetLine] = useState<string | null>(null);
  const [chatterLine, setChatterLine] = useState<string | null>(null);
  // 完成气泡限时与粒子；特效开关 / reduced-motion 在 hook 内统一裁决。
  const [doneBubbleVisible, setDoneBubbleVisible] = useState(false);
  const { particles, spawnParticles } = usePetParticles(effectsEnabled && !reducedMotion);
  // 用户包视频加载失败时回退静态图；切包时重置。
  const [videoBroken, setVideoBroken] = useState(false);
  useEffect(() => {
    setVideoBroken(false);
  }, [packId]);

  const clickTimesRef = useRef<number[]>([]);
  const dizzyCooldownUntilRef = useRef(0);
  const reactionTimerRef = useRef<number | null>(null);
  const petLineTimerRef = useRef<number | null>(null);

  const { chatterLinePool, petLinePool, dizzyLinePool, moodLine } = usePetLines(
    usingPack,
    displayMood,
  );

  // 情绪迁移：进入 done 时冒星星 + 限时完成气泡；离开 done 收起气泡。
  const prevMoodRef = useRef<PetMood>("idle");
  useEffect(() => {
    const previous = prevMoodRef.current;
    prevMoodRef.current = mood;
    if (mood === "done" && previous !== "done") {
      setDoneBubbleVisible(true);
      spawnParticles("star", 6);
    } else if (mood !== "done") {
      setDoneBubbleVisible(false);
    }
  }, [mood, spawnParticles]);

  useEffect(() => {
    if (!doneBubbleVisible) {
      return;
    }
    const timer = setTimeout(() => setDoneBubbleVisible(false), DONE_BUBBLE_MS);
    return () => clearTimeout(timer);
  }, [doneBubbleVisible]);

  // 犯困态周期性冒 Zzz。
  useEffect(() => {
    if (displayMood !== "sleepy") {
      return;
    }
    spawnParticles("zzz", 1);
    const interval = window.setInterval(() => spawnParticles("zzz", 1), 2600);
    return () => window.clearInterval(interval);
  }, [displayMood, spawnParticles]);

  // 会话离开空闲时，正在播放的空闲小动作/迎接立即让位给情绪动画。
  useEffect(() => {
    if (mood !== "idle") {
      setAmbientAction(null);
      setGreetVisible(false);
    }
  }, [mood]);

  // 空闲小动作调度：8–18s 随机播一个，播完重新排队。
  useEffect(() => {
    if (!enabled || mood !== "idle" || reactionAction || reducedMotion) {
      return;
    }
    let cancelled = false;
    let clearTimer: number | undefined;
    const playTimer = window.setTimeout(
      () => {
        if (cancelled) {
          return;
        }
        const action = pickAction(IDLE_ACTIONS);
        setAmbientAction(action);
        clearTimer = window.setTimeout(() => {
          if (!cancelled) {
            setAmbientAction(null);
          }
        }, action.durationMs);
      },
      IDLE_ACTION_MIN_DELAY_MS +
        Math.random() * (IDLE_ACTION_MAX_DELAY_MS - IDLE_ACTION_MIN_DELAY_MS),
    );
    return () => {
      cancelled = true;
      window.clearTimeout(playTimer);
      window.clearTimeout(clearTimer);
    };
  }, [enabled, mood, reactionAction, reducedMotion]);

  // 随机搭话调度：空闲时偶尔冒一句陪伴语。
  useEffect(() => {
    if (!enabled || mood !== "idle" || reducedMotion) {
      return;
    }
    let cancelled = false;
    let hideTimer: number | undefined;
    const showTimer = window.setTimeout(
      () => {
        if (cancelled) {
          return;
        }
        setChatterLine(pickAction(chatterLinePool));
        hideTimer = window.setTimeout(() => {
          if (!cancelled) {
            setChatterLine(null);
          }
        }, CHATTER_LINE_MS);
      },
      CHATTER_MIN_DELAY_MS + Math.random() * (CHATTER_MAX_DELAY_MS - CHATTER_MIN_DELAY_MS),
    );
    return () => {
      cancelled = true;
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, [enabled, mood, reducedMotion, chatterLinePool]);

  // 卸载时清掉命令式定时器。
  useEffect(() => {
    return () => {
      if (reactionTimerRef.current !== null) {
        window.clearTimeout(reactionTimerRef.current);
      }
      if (petLineTimerRef.current !== null) {
        window.clearTimeout(petLineTimerRef.current);
      }
    };
  }, []);

  const handlePet = () => {
    setSleepy(false);
    const now = Date.now();
    const recentClicks = clickTimesRef.current.filter((t) => now - t <= PET_CLICK_WINDOW_MS);
    recentClicks.push(now);
    clickTimesRef.current = recentClicks;

    const { dizzy } = resolvePetReaction(recentClicks, now);
    let chosen: PetAction;
    if (dizzy) {
      if (now < dizzyCooldownUntilRef.current) {
        return;
      }
      dizzyCooldownUntilRef.current = now + DIZZY_COOLDOWN_MS;
      clickTimesRef.current = [];
      chosen = DIZZY_ACTION;
      setPetLine(pickAction(dizzyLinePool));
    } else if (Math.random() < PET_SPECIAL_CHANCE) {
      // 特别反应：开心到转圈，同步撒星星。
      chosen = PET_SPECIAL_ACTION;
      spawnParticles("star", 6);
      if (Math.random() < PET_LINE_CHANCE) {
        setPetLine(pickAction(petLinePool));
      }
    } else {
      chosen = pickAction(PET_ACTIONS);
      if (Math.random() < PET_LINE_CHANCE) {
        setPetLine(pickAction(petLinePool));
      }
      spawnParticles("heart", Math.random() < 0.5 ? 1 : 2);
    }

    setReactionAction(chosen);
    if (reactionTimerRef.current !== null) {
      window.clearTimeout(reactionTimerRef.current);
    }
    reactionTimerRef.current = window.setTimeout(() => {
      setReactionAction(null);
    }, chosen.durationMs);
    if (petLineTimerRef.current !== null) {
      window.clearTimeout(petLineTimerRef.current);
    }
    petLineTimerRef.current = window.setTimeout(() => {
      setPetLine(null);
    }, CHATTER_LINE_MS);
  };

  // 拖拽换位：位移超阈值算拖动，否则 pointerup 走摸摸判定。
  const { wrapperRef, effectivePosition, isDragging, handlers } = usePetDrag({
    position,
    onPositionChange: setPetPosition,
    onTap: handlePet,
  });

  if (!enabled) {
    return null;
  }

  // 情绪 → 资产：内置包查同构视觉表；用户包按 moodAssets → working → idle 链回退。
  const resolveAsset = (target: PetMood): PetAsset => {
    if (!usingPack) {
      return BUILTIN_MOOD_VISUALS[target].asset;
    }
    const key = MOOD_ASSET_KEY[target];
    const moodAsset = key ? usingPack.moodAssets[key] : undefined;
    if (moodAsset) {
      return moodAsset;
    }
    const workingish = target === "working" || target === "permission" || target === "question";
    return workingish ? usingPack.working : usingPack.idle;
  };

  const asset = resolveAsset(displayMood);
  const builtinVisual = BUILTIN_MOOD_VISUALS[displayMood];

  // 气泡优先级：情绪台词 > 互动语 > 随机搭话；瞬态气泡（done）只在展示窗口内出现。
  const moodBubbleVisible = moodLine !== null && (displayMood !== "done" || doneBubbleVisible);
  const bubbleText = !bubblesEnabled
    ? null
    : moodBubbleVisible
      ? moodLine
      : (petLine ?? chatterLine);
  // 动作优先级：点击反应 > 空闲小动作 > 情绪动画（动效本身有真实动作，不再叠加 CSS）。
  const animationClass =
    asset.video && !reducedMotion && !videoBroken
      ? ""
      : (reactionAction?.className ?? ambientAction?.className ?? builtinVisual.animation);

  return (
    // 容器仍不拦截交互；只有立绘本体（button）可点、可拖。
    <div
      ref={wrapperRef}
      style={effectivePosition ? { ...effectivePosition } : undefined}
      className={cn(
        "pointer-events-none absolute z-10 flex flex-col items-center gap-1.5",
        !effectivePosition && "bottom-24 right-3",
        !effectivePosition &&
          "@max-[640px]/conversation:bottom-20 @max-[640px]/conversation:right-1",
        isDragging && "select-none",
      )}
    >
      {bubbleText !== null ? (
        <div
          className={cn(
            "skcode-pet-bubble max-w-48 rounded-xl rounded-br-sm border border-border",
            "bg-popover px-2.5 py-1.5 text-center text-ui-caption text-foreground shadow-md",
          )}
        >
          {bubbleText}
        </div>
      ) : null}
      <div className="relative">
        <button
          type="button"
          {...handlers}
          onClick={(event) => {
            // 键盘激活（Enter/Space）没有 pointer 事件，detail 为 0 时走这里。
            if (event.detail === 0) {
              handlePet();
            }
          }}
          aria-label={
            usingPack ? usingPack.name : intl.formatMessage({ id: "pet.silverkorali.pet" })
          }
          className={cn(
            "pointer-events-auto block cursor-grab touch-none border-0 bg-transparent p-0 transition-transform active:scale-[0.98]",
            isDragging ? "cursor-grabbing" : "hover:scale-[1.03]",
          )}
        >
          <PetFigure
            asset={asset}
            reducedMotion={reducedMotion}
            broken={videoBroken}
            onBroken={() => setVideoBroken(true)}
            sizePx={petSize}
            animationClass={animationClass}
            cacheKey={`${packId}-${displayMood}`}
          />
        </button>
        {particles.map((particle) => (
          <span
            key={particle.id}
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute top-2",
              particle.kind === "heart" && "skcode-pet-heart fill-current text-destructive",
              particle.kind === "star" && "skcode-pet-star fill-current text-amber-400",
              particle.kind === "zzz" &&
                "skcode-pet-zzz text-ui-caption font-semibold text-muted-foreground",
            )}
            style={{
              right: `${Math.max(0, 8 + particle.offsetXPercent)}%`,
              animationDelay: `${particle.delayMs}ms`,
            }}
          >
            {particle.kind === "heart" ? (
              <Heart className="size-3.5" />
            ) : particle.kind === "star" ? (
              <Sparkle className="size-3" />
            ) : (
              "Z"
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
