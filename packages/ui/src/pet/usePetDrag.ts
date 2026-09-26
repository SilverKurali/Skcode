/**
 * Skcode 宠物的拖拽换位：位移超过阈值才算拖动，否则 pointerup 走点击（摸摸）判定。
 * 位置以「会话容器右/下边距 px」表达并持久化；越界自动收敛。见 specs/pet-system.md v5。
 */
import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { PetPosition } from "@/store/petPreferences.js";

/** 拖拽判定阈值：位移小于该值视为点击。 */
const DRAG_THRESHOLD_PX = 6;
/** 默认停靠位（与组件 className 的 bottom-24/right-3 一致）。 */
export const PET_DEFAULT_RIGHT_PX = 12;
export const PET_DEFAULT_BOTTOM_PX = 96;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function usePetDrag(options: {
  /** 已持久化的位置（null=默认右下角）。 */
  position: PetPosition | null;
  /** 拖拽结束时写回持久化。 */
  onPositionChange: (position: PetPosition | null) => void;
  /** 未发生拖拽的 pointerup（即点击）。 */
  onTap: () => void;
}): {
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  dragPos: PetPosition | null;
  effectivePosition: PetPosition | null;
  isDragging: boolean;
  handlers: {
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
    onPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => void;
    onPointerUp: () => void;
    onPointerCancel: () => void;
  };
} {
  const { position, onPositionChange, onTap } = options;
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [dragPos, setDragPos] = useState<PetPosition | null>(null);
  const dragStateRef = useRef<{
    startX: number;
    startY: number;
    startRight: number;
    startBottom: number;
    moved: boolean;
  } | null>(null);
  const dragPosRef = useRef<PetPosition | null>(null);
  dragPosRef.current = dragPos;
  const onTapRef = useRef(onTap);
  onTapRef.current = onTap;
  const onPositionChangeRef = useRef(onPositionChange);
  onPositionChangeRef.current = onPositionChange;

  const effectivePosition = dragPos ?? position;
  const isDragging = dragPos !== null;

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) {
      return;
    }
    const wrapper = wrapperRef.current;
    if (!wrapper || !wrapper.offsetParent) {
      return;
    }
    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startRight: effectivePosition?.right ?? PET_DEFAULT_RIGHT_PX,
      startBottom: effectivePosition?.bottom ?? PET_DEFAULT_BOTTOM_PX,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const state = dragStateRef.current;
    if (!state) {
      return;
    }
    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;
    if (!state.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) {
      return;
    }
    state.moved = true;
    const wrapper = wrapperRef.current;
    const parent = wrapper?.offsetParent;
    const width = wrapper?.offsetWidth ?? 0;
    const height = wrapper?.offsetHeight ?? 0;
    const maxRight = parent ? Math.max(0, parent.clientWidth - width - 4) : state.startRight;
    const maxBottom = parent ? Math.max(0, parent.clientHeight - height - 4) : state.startBottom;
    setDragPos({
      right: clamp(state.startRight - dx, 0, maxRight),
      bottom: clamp(state.startBottom - dy, 0, maxBottom),
    });
  };

  const handlePointerUp = () => {
    const state = dragStateRef.current;
    dragStateRef.current = null;
    if (!state) {
      return;
    }
    if (state.moved) {
      const final = dragPosRef.current;
      if (final) {
        onPositionChangeRef.current(final);
      }
      setDragPos(null);
      return;
    }
    onTapRef.current();
  };

  const handlePointerCancel = () => {
    dragStateRef.current = null;
    setDragPos(null);
  };

  return {
    wrapperRef,
    dragPos,
    effectivePosition,
    isDragging,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
    },
  };
}
