import type { SkcodeBackgroundTaskControlItem } from "./background-task-controls.js";

export function mergeSkcodeBackgroundTaskControlItems(
  current: readonly SkcodeBackgroundTaskControlItem[],
  updates: readonly SkcodeBackgroundTaskControlItem[],
): SkcodeBackgroundTaskControlItem[] {
  const jobsById = new Map(current.map((job) => [job.jobId, job] as const));
  for (const job of updates) {
    jobsById.set(job.jobId, job);
  }
  return Array.from(jobsById.values());
}
