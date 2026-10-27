"use client";

import {
  adjacentPage,
  validPagination,
  type PaginationDisplay,
} from "../model/explore-display";
import { exploreCopy as copy } from "../copy";
import styles from "./explore.module.css";

export function ExplorePagination({
  title,
  page,
  busy = false,
  onPageChange,
}: Readonly<{
  title: string;
  page?: PaginationDisplay;
  busy?: boolean;
  onPageChange?: (page: number) => void;
}>) {
  return (
    <nav
      aria-label={`${title} ${copy.pagination}`}
      className={styles.pagination}
    >
      {validPagination(page) && (
        <span
          className={styles.currentPage}
          aria-current="page"
          aria-label={`${copy.page} ${page.currentPage}`}
        >
          {page.currentPage}
        </span>
      )}
      {(["previous", "next"] as const).map((direction) => {
        const target = adjacentPage(page, direction);
        const disabled = busy || !onPageChange || target === undefined;
        return (
          <button
            key={direction}
            type="button"
            disabled={disabled}
            aria-label={copy[direction]}
            className={styles.pageButton}
            onClick={() => {
              if (!disabled && target !== undefined) onPageChange?.(target);
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/ori/explore/page-${direction}.svg`}
              width={28}
              height={28}
              alt=""
              className={
                direction === "previous" ? styles.previousIcon : undefined
              }
            />
          </button>
        );
      })}
    </nav>
  );
}
