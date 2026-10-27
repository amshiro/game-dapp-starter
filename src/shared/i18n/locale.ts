// Explicit selection is persisted server-side; browser language never overrides it.
export const supportedLocales = ["en", "zh-CN"] as const;
export type Locale = (typeof supportedLocales)[number];
export const defaultLocale: Locale = "en";
export const localeCookieName = "app_locale";

export function resolveLocale(preference?: string): Locale {
  return (
    supportedLocales.find((locale) => locale === preference) ?? defaultLocale
  );
}
export function nextLocale(locale: Locale): Locale {
  return locale === "en" ? "zh-CN" : "en";
}
