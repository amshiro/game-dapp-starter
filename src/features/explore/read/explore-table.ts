import { queryOptions } from "@tanstack/react-query";
import { isAddress } from "viem";
import { formatDecimal } from "../../../shared/lib/number/format-decimal";
import type { Locale } from "../../../shared/i18n/locale";
import { exploreDecimal } from "../api/explore-statistics";
import { exploreCount, getExploreRecords } from "../api/explore-records";
import type {
  BuybackRow,
  ExploreSectionId,
  MiningRow,
  ReadDisplay,
} from "../model/explore-display";

const amount = (value: unknown) =>
  formatDecimal(exploreDecimal(value), { shift: -8, decimals: 6, group: true });
const id = (row: Record<string, unknown>) => String(exploreCount(row.id));
export function miningRow(
  row: Record<string, unknown>,
  locale: Locale,
): MiningRow {
  const winners = exploreCount(row.num_winners);
  const square = exploreCount(row.winning_square);
  if (square > 24 || typeof row.split_reward !== "boolean")
    throw Error("Invalid mining record");
  let winner = locale === "zh-CN" ? "无人获奖" : "No winner";
  if (winners > 0) {
    if (row.split_reward) winner = locale === "zh-CN" ? "平分" : "Split";
    else {
      if (typeof row.top_miner !== "string" || !isAddress(row.top_miner))
        throw Error("Invalid winner");
      winner = `${row.top_miner.slice(0, 6)}…${row.top_miner.slice(-4)}`;
    }
  }
  return {
    id: id(row),
    cells: [
      `#${exploreCount(row.round_id)}`,
      `#${square + 1}`,
      winner,
      String(winners),
      amount(row.total_deploy),
    ],
  };
}
export function buybackRow(
  row: Record<string, unknown>,
  locale: Locale,
): BuybackRow {
  const seconds = exploreCount(row.timestamp);
  const date = new Date(seconds * 1000);
  if (!Number.isFinite(date.getTime()))
    throw Error("Invalid buyback timestamp");
  const time = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return {
    id: id(row),
    cells: [
      time,
      amount(row.amount_in),
      amount(row.burned),
      `${formatDecimal(exploreDecimal(row.staking_yield), { decimals: 2, pad: true })}%`,
    ],
  };
}
export function exploreTableQuery(
  base: string | null,
  chainId: number,
  section: ExploreSectionId,
  page: number,
  locale: Locale,
) {
  return queryOptions({
    queryKey: ["explore", base, chainId, section, page, locale],
    staleTime: 10_000,
    refetchInterval: 10_000,
    retry: 1,
    queryFn: async ({ signal }) => {
      const result = await getExploreRecords(section, page, signal);
      const rows = result.rows.map((row) =>
        section === "buybacks"
          ? buybackRow(row, locale)
          : miningRow(row, locale),
      );
      if (new Set(rows.map((row) => row.id)).size !== rows.length)
        throw Error("Duplicate Explore records");
      return { rows, total: result.total };
    },
  });
}
export function tableDisplay<Row>(
  query: {
    data?: { rows: Row[]; total: number };
    isPending: boolean;
    isError: boolean;
  },
  page: number,
) {
  // A background refetch retains the current page's data, including on transient failure.
  const data: ReadDisplay<readonly Row[]> = query.data
    ? query.data.rows.length
      ? { status: "populated", value: query.data.rows }
      : { status: "empty" }
    : { status: query.isPending ? "loading" : "error" };
  return {
    data,
    pagination: query.data
      ? {
          currentPage: page,
          total: query.data.total,
          hasPrevious: page > 1,
          hasNext: page * 10 < query.data.total,
        }
      : undefined,
  };
}
