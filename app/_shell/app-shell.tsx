import Link from "next/link";
import type { ReactNode } from "react";
import { OriViewport } from "../ori-viewport";
import { BottomNavigation } from "./bottom-navigation";
import { shellRoutes } from "./routes";
import styles from "./shell.module.css";

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <OriViewport className={styles.shell}>
      <a className={styles.skip} href="#main-content">
        Skip to content
      </a>
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <Link
            className={styles.brand}
            href={shellRoutes[0].href}
            aria-label="ORI home"
          >
            {/* Exact current Figma assets; final brand approval remains Q-03. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ori/shell/mark.svg" width={28} height={28} alt="" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ori/shell/wordmark.svg"
              width={41}
              height={16}
              alt="ORI"
            />
          </Link>
          <button
            type="button"
            className={styles.connect}
            disabled
            aria-label="Connect wallet, unavailable"
          >
            Connect
          </button>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className={styles.main}>
        {children}
      </main>
      <BottomNavigation />
    </OriViewport>
  );
}
