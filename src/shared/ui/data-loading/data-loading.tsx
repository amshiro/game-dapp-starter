import type { CSSProperties } from "react";
import styles from "./data-loading.module.css";

export function DataLoading({
  label,
  size = 13,
  color,
}: Readonly<{ label: string; size?: number; color?: CSSProperties["color"] }>) {
  return (
    <span
      className={styles.loading}
      data-loading="data"
      style={color === undefined ? undefined : { color }}
      role="status"
      aria-label={label}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="var(--ori-color-text-muted)"
          strokeWidth="2.5"
        />
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="16 47"
        />
      </svg>
    </span>
  );
}
