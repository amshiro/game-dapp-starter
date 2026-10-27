import { createServerI18next } from "next-i18next/server";
import { createI18nConfig } from "@/src/shared/i18n/config";
import { resolveLocale } from "@/src/shared/i18n/locale";
import home from "./_locales/en.json";

// Server-only composition of owner resources; Client Components must not import it.
const resources = { en: { home } };

const { getT } = createServerI18next(createI18nConfig(resources));

export function getTranslation(namespace: keyof (typeof resources)["en"]) {
  // An explicit lng stops next-i18next from reading its own cookie/header inputs.
  return getT(namespace, { lng: resolveLocale() });
}
