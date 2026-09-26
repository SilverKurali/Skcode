const SKCODE_PROCESS_PREFIX = "skcode";
const MAX_PROCESS_NAME_SEGMENT_LENGTH = 24;

function sanitizeProcessNameSegment(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!normalized) {
    return null;
  }

  return normalized.slice(0, MAX_PROCESS_NAME_SEGMENT_LENGTH);
}

function joinSkcodeProcessName(...segments: Array<string | null | undefined>): string {
  const sanitizedSegments = segments
    .map((segment) => sanitizeProcessNameSegment(segment))
    .filter((segment): segment is string => Boolean(segment));
  return [SKCODE_PROCESS_PREFIX, ...sanitizedSegments].join("-");
}

function pickWorkspaceTag(workspacePath: string | null | undefined): string | undefined {
  const trimmedPath = workspacePath?.trim();
  if (!trimmedPath) {
    return undefined;
  }

  const parts = trimmedPath.split(/[\\/]+/).filter(Boolean);
  return parts.at(-1) ?? trimmedPath;
}

export function formatSkcodeMainProcessName(): string {
  return joinSkcodeProcessName("main");
}

export function formatSkcodeGpuProcessName(): string {
  return joinSkcodeProcessName("gpu");
}

export function formatSkcodeHostProcessName(label?: string): string {
  return joinSkcodeProcessName("host", label);
}

export function formatSkcodeRendererProcessName(windowTitle?: string): string {
  const normalizedTitle = windowTitle?.trim();
  if (!normalizedTitle || normalizedTitle === "Skcode") {
    return joinSkcodeProcessName("renderer", "main");
  }

  if (normalizedTitle === "Resource Manager") {
    return joinSkcodeProcessName("renderer", "resource-manager");
  }

  const remoteWindowPrefix = "Skcode - ";
  if (normalizedTitle.startsWith(remoteWindowPrefix)) {
    return joinSkcodeProcessName(
      "renderer",
      "remote",
      normalizedTitle.slice(remoteWindowPrefix.length),
    );
  }

  return joinSkcodeProcessName("renderer", normalizedTitle);
}

export function formatSkcodeAgentProcessName(provider: string, workspacePath?: string): string {
  return joinSkcodeProcessName("agent", provider, pickWorkspaceTag(workspacePath));
}

export function formatSkcodeUtilityProcessName(name?: string, type = "utility"): string {
  return joinSkcodeProcessName(type, name);
}
