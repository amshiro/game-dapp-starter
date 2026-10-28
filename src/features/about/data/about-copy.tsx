import type { ReactNode } from "react";
import type { Locale } from "../../../shared/i18n/locale";
import en from "../locales/en.json";
import zh from "../locales/zh-CN.json";

// About copy was recovered from the current ori-website source because the original product requirements are unavailable.
// Only the five Figma sections are published here; this copy does not validate contract fees or transaction rules.
export function getAboutCopy(locale: Locale) {
  return locale === "zh-CN" ? zh : en;
}

/** Preserve the source's numbered emphasis without treating translation strings as HTML. */
export function recoveredInlineCopy(text: string): ReactNode[] {
  return text.split(/(<\d+>.*?<\/\d+>)/g).map((part, index) => {
    const emphasis = /^<(\d+)>(.*?)<\/\1>$/.exec(part);
    return emphasis ? <strong key={index}>{emphasis[2]}</strong> : part;
  });
}
