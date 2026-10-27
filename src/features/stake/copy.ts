"use client";
import { useLocale } from "../../shared/i18n/locale-provider";
import en from "./locales/en.json";
import zh from "./locales/zh-CN.json";
const resources = { en, "zh-CN": zh };
export function useStakeCopy() {
  return resources[useLocale()];
}
