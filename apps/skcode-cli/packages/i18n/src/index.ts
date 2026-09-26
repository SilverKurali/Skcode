import type { UiLocale, SupportedLocale } from "@skcode/contracts";
import { enUS } from "./locales/en-US.js";
import { zhCN } from "./locales/zh-CN.js";
import {
  DEFAULT_LOCALE,
  detectLocale,
  isSupportedLocale,
  isUiLocale,
  resolveLocale,
  SUPPORTED_LOCALES,
} from "./locale.js";
import type { SkcodeCopy } from "./types.js";

export {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  detectLocale,
  isSupportedLocale,
  isUiLocale,
  resolveLocale,
};
export type { LocaleDetectionInput } from "./locale.js";
export type { CliCopy, TuiCopy, UiLocale, SupportedLocale, SkcodeCopy } from "./types.js";

const CATALOGS: Record<SupportedLocale, SkcodeCopy> = {
  "en-US": enUS,
  "zh-CN": zhCN,
};

export function getSkcodeCopy(locale?: UiLocale | string, detected?: string | null): SkcodeCopy {
  return CATALOGS[resolveLocale(locale, detected)];
}
