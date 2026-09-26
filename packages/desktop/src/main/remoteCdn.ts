import { SKCODE_VERSION, type SkcodeEnv } from "@skcode/shared";

declare const __SKCODE_CDN_BASE_URL__: string | undefined;
const DEFAULT_CDN_BASE_URL = "https://cdn-zcode.z.ai";

export interface ResolveRemoteCdnOptions {
  env?: SkcodeEnv;
  locale?: string;
  timeZone?: string;
  overrideBaseUrl?: string;
  version?: string;
  now?: Date;
}

function normalizeBaseUrl(value: string): string {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol))
    throw new Error("CDN URL must use http or https");
  return value.replace(/\/+$/, "");
}

export function resolveRemoteCdnBaseUrls(options: ResolveRemoteCdnOptions = {}): string[] {
  const override = options.overrideBaseUrl?.trim();
  if (override) return [normalizeBaseUrl(override)];
  const baseUrl =
    process.env.SKCODE_CDN_BASE_URL?.trim() ||
    (typeof __SKCODE_CDN_BASE_URL__ === "undefined" ? "" : __SKCODE_CDN_BASE_URL__) ||
    DEFAULT_CDN_BASE_URL;
  return [
    `${normalizeBaseUrl(baseUrl)}/skcode/electron/releases/${options.version ?? SKCODE_VERSION}`,
  ];
}
