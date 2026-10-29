"use client";
import { Fragment } from "react";
import styles from "./pagination.module.css";
export type PaginationState = Readonly<{
  currentPage: number;
  total: number;
  pageSize: number;
}>;
export function Pagination({
  page,
  busy = false,
  onPageChange,
  labels,
}: Readonly<{
  page?: PaginationState;
  busy?: boolean;
  onPageChange?: (page: number) => void;
  labels: Readonly<{
    title: string;
    previous: string;
    next: string;
    page: string;
  }>;
}>) {
  if (
    !page ||
    !Number.isSafeInteger(page.total) ||
    !Number.isSafeInteger(page.pageSize) ||
    page.pageSize <= 0 ||
    page.total <= page.pageSize ||
    !Number.isSafeInteger(page.currentPage) ||
    page.currentPage < 1
  )
    return null;
  const last = Math.ceil(page.total / page.pageSize);
  return (
    <nav className={styles.pagination} aria-label={labels.title}>
      {(["previous", "next"] as const).map((direction) => {
        const target = page.currentPage + (direction === "previous" ? -1 : 1);
        const disabled = busy || !onPageChange || target < 1 || target > last;
        return (
          <Fragment key={direction}>
            {direction === "next" && (
              <span
                className={styles.currentPage}
                aria-current="page"
                aria-label={`${labels.page} ${page.currentPage}`}
              >
                {page.currentPage}
              </span>
            )}
            <button
              className={styles.pageButton}
              type="button"
              disabled={disabled}
              aria-label={labels[direction]}
              onClick={() => {
                if (!disabled) onPageChange?.(target);
              }}
            >
              {/* Reuses the existing approved pagination assets. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/ori/explore/page-${direction}${disabled ? "" : "-active"}.svg`}
                width={28}
                height={28}
                alt=""
                className={
                  direction === "previous" ? styles.previousIcon : undefined
                }
              />
            </button>
          </Fragment>
        );
      })}
    </nav>
  );
}
