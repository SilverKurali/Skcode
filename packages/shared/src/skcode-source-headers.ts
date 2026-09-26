import { DEFAULT_SKCODE_ENDPOINT_ORIGIN } from "./skcodeEndpoint.js";

export const SKCODE_SOURCE_HEADERS = {
  "User-Agent": "Skcode/unknown",
  "HTTP-Referer": DEFAULT_SKCODE_ENDPOINT_ORIGIN,
  "X-Title": "Z Code@electron",
} as const;

export interface BuildSkcodeSourceHeadersFromContextOptions {
  appVersion?: string;
  arch?: string;
  clientLanguage?: string;
  clientTimezone?: string;
  deviceMid?: string;
  endpointOrigin?: string;
  osVersion?: string;
  platform?: string;
  releaseChannel?: string;
  sourceTitle?: string;
}

export function normalizeSkcodeSourceHeaderValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || !/^[\x20-\x7e]+$/.test(trimmed)) {
    return undefined;
  }
  return trimmed;
}

export function buildSkcodeSourceHeadersFromContext(
  options: BuildSkcodeSourceHeadersFromContextOptions = {},
): Record<string, string> {
  const appVersion = normalizeSkcodeSourceHeaderValue(options.appVersion);
  const arch = normalizeSkcodeSourceHeaderValue(options.arch);
  const clientLanguage = normalizeSkcodeSourceHeaderValue(options.clientLanguage) ?? "unknown";
  const clientTimezone = normalizeSkcodeSourceHeaderValue(options.clientTimezone) ?? "unknown";
  const deviceMid = normalizeSkcodeSourceHeaderValue(options.deviceMid);
  const endpointOrigin =
    normalizeSkcodeSourceHeaderValue(options.endpointOrigin) ?? DEFAULT_SKCODE_ENDPOINT_ORIGIN;
  const osVersion = normalizeSkcodeSourceHeaderValue(options.osVersion);
  const platform = normalizeSkcodeSourceHeaderValue(options.platform);
  const releaseChannel = normalizeSkcodeSourceHeaderValue(options.releaseChannel);
  const sourceTitle = normalizeSkcodeSourceHeaderValue(options.sourceTitle) ?? "electron";

  return {
    ...SKCODE_SOURCE_HEADERS,
    "HTTP-Referer": endpointOrigin,
    "User-Agent": `Skcode/${appVersion ?? "unknown"}`,
    ...(appVersion ? { "X-Skcode-App-Version": appVersion } : {}),
    "X-Title": `Z Code@${sourceTitle}`,
    ...(platform && arch ? { "X-Platform": `${platform}-${arch}` } : {}),
    ...(releaseChannel ? { "X-Release-Channel": releaseChannel } : {}),
    "X-Client-Language": clientLanguage,
    "X-Client-Timezone": clientTimezone,
    ...(platform ? { "X-Os-Category": normalizeOsCategory(platform) } : {}),
    ...(osVersion ? { "X-Os-Version": osVersion } : {}),
    ...(deviceMid ? { "X-Device-Mid": deviceMid } : {}),
  };
}

function normalizeOsCategory(platform: string): string {
  switch (platform) {
    case "darwin":
      return "macos";
    case "win32":
      return "windows";
    default:
      return "linux";
  }
}
