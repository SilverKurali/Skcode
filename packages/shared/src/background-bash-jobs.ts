import {
  collectVisibleSkcodeBackgroundTaskControlItems,
  getSkcodeBackgroundTaskControlItemElapsedMs,
  isActiveSkcodeBackgroundTaskControlItem,
  parseSkcodeBackgroundTaskControlItems,
  type SkcodeBackgroundTaskControlItem,
  type SkcodeBackgroundTaskControlStatus,
} from "./background-task-controls.js";

export type SkcodeBackgroundBashJobStatus = SkcodeBackgroundTaskControlStatus;
export type SkcodeBackgroundBashJob = SkcodeBackgroundTaskControlItem & {
  taskKind: "bash";
};

export function parseSkcodeBackgroundBashJobs(value: unknown): SkcodeBackgroundBashJob[] {
  return parseSkcodeBackgroundTaskControlItems(value).filter(isBackgroundBashJob);
}

export function isActiveSkcodeBackgroundBashJob(job: SkcodeBackgroundBashJob): boolean {
  return isActiveSkcodeBackgroundTaskControlItem(job);
}

export function getSkcodeBackgroundBashJobElapsedMs(
  job: SkcodeBackgroundBashJob,
  now = Date.now(),
): number {
  return getSkcodeBackgroundTaskControlItemElapsedMs(job, now);
}

export function collectVisibleSkcodeBackgroundBashJobs(
  jobs: readonly SkcodeBackgroundBashJob[],
  now = Date.now(),
  thresholdMs = 30_000,
): Array<SkcodeBackgroundBashJob & { elapsedMs: number }> {
  return collectVisibleSkcodeBackgroundTaskControlItems(jobs, now, thresholdMs) as Array<
    SkcodeBackgroundBashJob & { elapsedMs: number }
  >;
}

function isBackgroundBashJob(job: SkcodeBackgroundTaskControlItem): job is SkcodeBackgroundBashJob {
  return job.taskKind === "bash";
}
