import type { ModelSwitchStage } from "@/store/skcodeSessionStoreTypes.js";

export function shouldBlockTaskSelectionDuringModelRestart(
  modelSwitchPending: boolean,
  modelSwitchStage: ModelSwitchStage,
): boolean {
  return modelSwitchPending && modelSwitchStage === "restartingRuntime";
}
