// Presentation contracts only. No backend fields, units, parsing or Query state.
export type ReadDisplay<T> =
  | Readonly<{ status: "loading" | "empty" | "error" | "unavailable" }>
  | Readonly<{ status: "populated"; value: T }>;

export type StatisticId =
  "maxSupply" | "circulatingSupply" | "buried" | "protocolRevenue";
export type ExploreSectionId = "mining" | "motherlodes" | "buybacks";
export type PaginationDisplay = Readonly<{
  currentPage: number;
  /** Total records from the data owner; page size is 10. */
  total?: number;
  hasPrevious: boolean;
  hasNext: boolean;
}>;
// Caller supplies already formatted, precision-safe text and a stable row key.
export type MiningRow = Readonly<{
  id: string;
  cells: readonly [string, string, string, string, string];
}>;
export type BuybackRow = Readonly<{
  id: string;
  cells: readonly [string, string, string, string];
}>;
type TableDisplay<Row> = Readonly<{
  data: ReadDisplay<readonly Row[]>;
  pagination?: PaginationDisplay;
}>;
export type ExploreDisplay = Readonly<{
  statistics: Readonly<Record<StatisticId, ReadDisplay<string>>>;
  mining: TableDisplay<MiningRow>;
  motherlodes: TableDisplay<MiningRow>;
  buybacks: TableDisplay<BuybackRow>;
}>;

export const unavailableExplore: ExploreDisplay = {
  statistics: {
    maxSupply: { status: "unavailable" },
    circulatingSupply: { status: "unavailable" },
    buried: { status: "unavailable" },
    protocolRevenue: { status: "unavailable" },
  },
  mining: { data: { status: "unavailable" } },
  motherlodes: { data: { status: "unavailable" } },
  buybacks: { data: { status: "unavailable" } },
};

export function validPagination(
  page?: PaginationDisplay,
): page is PaginationDisplay {
  return (
    !!page && Number.isSafeInteger(page.currentPage) && page.currentPage >= 1
  );
}
export function adjacentPage(
  page: PaginationDisplay | undefined,
  direction: "previous" | "next",
) {
  if (!validPagination(page)) return undefined;
  if (direction === "previous")
    return page.hasPrevious && page.currentPage > 1
      ? page.currentPage - 1
      : undefined;
  return page.hasNext && page.currentPage < Number.MAX_SAFE_INTEGER
    ? page.currentPage + 1
    : undefined;
}
