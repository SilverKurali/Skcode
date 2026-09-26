import { getSkcodeCopy, type SupportedLocale, type UiLocale } from "@skcode/i18n";

export function formatCliHelp(
  version: string,
  locale?: UiLocale,
  detectedLocale?: SupportedLocale,
): string {
  return getSkcodeCopy(locale, detectedLocale).cli.help(version);
}
