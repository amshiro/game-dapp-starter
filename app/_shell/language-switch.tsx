"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "../../src/shared/i18n/locale-provider";
import { localeCookieName, nextLocale } from "../../src/shared/i18n/locale";
import { getShellCopy } from "./copy";
import styles from "./shell.module.css";

export function LanguageSwitch() {
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      className={styles.languageSwitch}
      disabled={pending}
      aria-busy={pending || undefined}
      aria-label={getShellCopy(locale).switchLanguage}
      onClick={() =>
        startTransition(() => {
          // Persist before refreshing RSC: Server HTML and Client resources must agree.
          document.cookie = `${localeCookieName}=${nextLocale(locale)}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
          router.refresh();
        })
      }
    >
      {locale === "en" ? "EN" : "中"}
    </button>
  );
}
