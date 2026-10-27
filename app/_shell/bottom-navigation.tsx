"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { isRouteActive, shellRoutes } from "./routes";
import styles from "./shell.module.css";

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Primary navigation">
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
            <span>{route.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
