"use client";
import { Pagination } from "../../../shared/ui/pagination/pagination";
import type { PaginationDisplay } from "../model/explore-display";
import { useExploreCopy } from "../copy";
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
  const copy = useExploreCopy();
  return (
    <Pagination
      page={
        page && page.total !== undefined
          ? { currentPage: page.currentPage, total: page.total, pageSize: 10 }
          : undefined
      }
      busy={busy}
      onPageChange={onPageChange}
      labels={{
        title: `${title} ${copy.pagination}`,
        previous: copy.previous,
        next: copy.next,
        page: copy.page,
      }}
    />
  );
}
