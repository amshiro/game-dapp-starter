import type { Locale } from "../../src/shared/i18n/locale";
import en from "./locales/en.json";
import zh from "./locales/zh-CN.json";
const resources = { en, "zh-CN": zh };
export function getShellCopy(locale: Locale) {
  return resources[locale];
}
