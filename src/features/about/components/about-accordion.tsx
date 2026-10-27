"use client";

import { useId, useState, type ReactNode } from "react";
import styles from "./about-accordion.module.css";

export type AboutAccordionItem = Readonly<{
  /** Stable and unique within this About accordion. */
  id: string;
  title: string;
  content: ReactNode;
}>;

/** About-local presentation. The caller owns reviewed titles, content and locale. */
export function AboutAccordion({
  items,
}: Readonly<{ items: readonly AboutAccordionItem[] }>) {
  const instanceId = useId();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className={styles.accordion}>
      {items.map((item) => {
        const expanded = expandedId === item.id;
        const triggerId = `${instanceId}-${item.id}-trigger`;
        const panelId = `${instanceId}-${item.id}-panel`;
        return (
          <section key={item.id} className={styles.item}>
            <h2 className={styles.heading}>
              <button
                id={triggerId}
                type="button"
                className={styles.trigger}
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() =>
                  setExpandedId((current) =>
                    current === item.id ? null : item.id,
                  )
                }
              >
                <span>{item.title}</span>
                {/* Exact Figma vector; the expanded state uses the design’s -90° rotation. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/ori/about/chevron-right.svg"
                  className={expanded ? styles.expandedIcon : undefined}
                  width={16}
                  height={16}
                  alt=""
                />
              </button>
            </h2>
            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              hidden={!expanded}
              className={styles.panel}
            >
              {item.content}
            </div>
          </section>
        );
      })}
    </div>
  );
}
