import { resolveLocale } from "../../shared/i18n/locale";
import en from "./locales/en.json";
const resources = { en };
export const exploreCopy = resources[resolveLocale()];
