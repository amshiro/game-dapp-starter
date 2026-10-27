"use client";
import { createContext, useContext, type ReactNode } from "react";
import { defaultLocale, type Locale } from "./locale";
const LocaleContext = createContext<Locale>(defaultLocale);

/** Request-resolved locale only; no localStorage, wallet coupling or second preference state. */
export function LocaleProvider({
  locale,
  children,
}: Readonly<{ locale: Locale; children: ReactNode }>) {
  return <LocaleContext value={locale}>{children}</LocaleContext>;
}
export function useLocale(): Locale {
  return useContext(LocaleContext);
}
