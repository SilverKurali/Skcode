import type { LaunchMarks } from "@skcode/shared";

export function shouldReportLaunchToInput(state: {
  isStartupRenderBlocked: boolean;
  alreadyReported: boolean;
}): boolean {
  // 门禁清除 = RootStartupLoading 退场、输入框挂载，此时才算"能输入"。
  return !state.alreadyReported && !state.isStartupRenderBlocked;
}

export function readRendererLaunchTimings(): {
  marks: LaunchMarks | null;
  rendererStart: number;
  reactCommit: number;
} | null {
  const w = window as Window & {
    __SKCODE_LAUNCH_MARKS__?: LaunchMarks | null;
    __SKCODE_RENDERER_START__?: number;
    __SKCODE_REACT_COMMIT_AT__?: number;
  };
  const rendererStart = w.__SKCODE_RENDERER_START__;
  const reactCommit = w.__SKCODE_REACT_COMMIT_AT__;
  if (typeof rendererStart !== "number" || typeof reactCommit !== "number") {
    return null;
  }
  return { marks: w.__SKCODE_LAUNCH_MARKS__ ?? null, rendererStart, reactCommit };
}
