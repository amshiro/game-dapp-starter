import type { I18nConfig } from "next-i18next";
import { defaultLocale, supportedLocales, type Locale } from "./locale";

type Namespaces = Readonly<Record<string, Readonly<Record<string, unknown>>>>;

/** Every supported locale must provide the same owner namespaces. */
export type LocaleResources<N extends Namespaces = Namespaces> = Readonly<
  Record<Locale, N>
>;

function reportMissingTranslation(
  locales: readonly string[],
  namespace: string,
  key: string,
): void {
  // Rendered fallback text is not a complete translation; keep it visible in development.
  console.error(
    `[i18n] missing translation ${namespace}:${key} (${locales.join(", ")})`,
  );
}

export function createI18nConfig(resources: LocaleResources): I18nConfig {
  const reportMissing = process.env.NODE_ENV !== "production";
  return {
    supportedLngs: [...supportedLocales],
    fallbackLng: defaultLocale,
    ns: Object.keys(resources[defaultLocale]),
    resources,
    localeInPath: false,
    i18nextOptions: {
      // A key must resolve inside its owner namespace, never from another owner.
      fallbackNS: false,
      returnEmptyString: false,
      saveMissing: reportMissing,
      missingKeyHandler: reportMissing ? reportMissingTranslation : false,
    },
  };
}
