import { describe, expect, it } from "vitest";
import {
  buybackRow,
  miningRow,
  exploreTableQuery,
  tableDisplay,
} from "./explore-table";

describe("Explore confirmed table mapping", () => {
  it("uses winning square plus one and eight-decimal deploy amounts", () => {
    expect(
      miningRow(
        {
          id: 1654,
          round_id: 1654,
          winning_square: 23,
          split_reward: false,
          num_winners: 0,
          total_deploy: 100000,
        },
        "zh-CN",
      ).cells,
    ).toEqual(["#1654", "#24", "无人获奖", "0", "0.001"]);
  });
  it("uses burned rather than ore_received and does not rescale yield", () => {
    const row = buybackRow(
      {
        id: 2373,
        timestamp: 1770727078,
        amount_in: 3,
        burned: 65818,
        ore_received: 78975,
        staking_yield: "0.11514020282521537",
      },
      "en",
    );
    expect(row.cells.slice(1)).toEqual(["0", "0.000658", "0.11%"]);
  });
  it("isolates pages, sections, chains and backends in the cache", () => {
    const base = exploreTableQuery("api", 97, "mining", 2, "en");
    expect(base.refetchInterval).toBe(10000);
    for (const other of [
      exploreTableQuery("api", 97, "mining", 1, "en"),
      exploreTableQuery("api", 97, "motherlodes", 2, "en"),
      exploreTableQuery("other", 97, "mining", 2, "en"),
      exploreTableQuery("api", 56, "mining", 2, "en"),
    ])
      expect(other.queryKey).not.toEqual(base.queryKey);
  });
  it("retains page and rows through background failures, distinguishes initial loading and empty", () => {
    const data = { rows: ["row"], total: 23 };
    expect(tableDisplay({ data, isPending: false, isError: true }, 2)).toEqual({
      data: { status: "populated", value: ["row"] },
      pagination: {
        currentPage: 2,
        total: 23,
        hasPrevious: true,
        hasNext: true,
      },
    });
    expect(
      tableDisplay({ data, isPending: false, isError: false }, 3).pagination
        ?.hasNext,
    ).toBe(false);
    expect(
      tableDisplay({ isPending: true, isError: false }, 1).data.status,
    ).toBe("loading");
    expect(
      tableDisplay({ isPending: false, isError: true }, 1).data.status,
    ).toBe("error");
    expect(
      tableDisplay(
        { data: { rows: [], total: 0 }, isPending: false, isError: false },
        1,
      ).data.status,
    ).toBe("empty");
  });
});
