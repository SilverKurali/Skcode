/**
 * Skcode session UI 状态 store
 *
 * 一个 tab 对应一个 workspace，所以聊天相关状态也必须按 workspace 分桶保存。
 * 这样切换标签页时，当前任务、输入中的草稿态和初始化状态才不会互相串台。
 */
import { create } from "zustand";
import { shouldExposeE2EStoreBridge } from "@/lib/e2eStoreBridge.js";
import { type SkcodeSessionStoreState } from "./skcodeSessionStoreTypes.js";
import { getWorkspaceState } from "./skcodeSessionStoreSelectors.js";
import { createNavigationSlice } from "./skcodeSessionStoreNavigation.js";
import { createTaskSlice } from "./skcodeSessionStoreTaskSlice.js";
import { createWorkspaceSlice } from "./skcodeSessionStoreWorkspaceSlice.js";
import { uiMemoryDiagnosticsRegistry } from "@/lib/memoryDiagnostics.js";

export const useSkcodeSessionStore = create<SkcodeSessionStoreState>()((set, get) => ({
  workspaces: {},
  ...createNavigationSlice(set, get),
  ...createWorkspaceSlice(set),
  ...createTaskSlice(set),
  getWorkspaceState: (workspacePath: string, workspaceIdentity?: string) =>
    getWorkspaceState(get(), workspacePath, workspaceIdentity),
}));

type SkcodeSessionStoreE2EBridge = typeof useSkcodeSessionStore;

declare global {
  interface Window {
    __skcodeSessionStoreE2E?: SkcodeSessionStoreE2EBridge;
  }
}

if (shouldExposeE2EStoreBridge()) {
  // E2E 诊断入口必须由 WDIO 显式打开，不能复用 SKCODE_ENV=test，避免产品测试环境暴露可变全局 store。
  window.__skcodeSessionStoreE2E = useSkcodeSessionStore;
}

// ────────────────────────────────────────────
// Re-exports: 保持外部 `from '@/store/skcodeSessionStore'` 的导入路径继续工作
// ────────────────────────────────────────────
export * from "./skcodeSessionStoreTypes.js";
export * from "./skcodeSessionStoreSelectors.js";
// Re-export navigation types used externally:
export type {
  TaskNavigationHistory,
  TaskNavEntry,
  WorkspaceNavEntry,
} from "@/lib/taskNavigationHistory.js";

// 内存诊断计数器：workspace 桶全仓无删除路径，先落日志。
uiMemoryDiagnosticsRegistry.register("sessionStore", () => ({
  workspaces: Object.keys(useSkcodeSessionStore.getState().workspaces).length,
}));
