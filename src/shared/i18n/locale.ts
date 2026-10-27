// BCP 47 identifiers. Add a locale only together with reviewed resources for every namespace.
export const supportedLocales = ["en"] as const;

export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = "en";

/**
 * The single authoritative locale for a render.
 * No route, cookie, profile, or browser input is defined yet; when one is, its
 * precedence is decided here once instead of by individual pages.
 */
export function resolveLocale(): Locale {
  return defaultLocale;
}
