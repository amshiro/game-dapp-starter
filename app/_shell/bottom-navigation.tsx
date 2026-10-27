"use client";

import { useLocale } from "../../src/shared/i18n/locale-provider";
import { getShellCopy } from "./copy";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { isRouteActive, shellRoutes } from "./routes";
import styles from "./shell.module.css";

export function BottomNavigation() {
  const pathname = usePathname();
  const copy = getShellCopy(useLocale());

  return (
    <nav className={styles.nav} aria-label={copy.navigation}>
      <div className={styles.navItems}>
        {shellRoutes.map((route) => (
          <Link
            key={route.id}
            href={route.href}
            className={styles.navLink}
            aria-current={
              isRouteActive(pathname, route.href) ? "page" : undefined
            }
          >
            <span
              aria-hidden="true"
              className={styles.icon}
              style={
                {
                  "--icon-url": `url(/ori/shell/${route.id}.svg)`,
                } as CSSProperties
              }
            />
            <span>{copy[route.id]}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
