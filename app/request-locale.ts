import { cookies } from "next/headers";
import { localeCookieName, resolveLocale } from "../src/shared/i18n/locale";

/** All Server Components use the same request-visible preference policy. */
export async function getRequestLocale() {
  return resolveLocale((await cookies()).get(localeCookieName)?.value);
}
