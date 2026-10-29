"use client";
import { useState } from "react";
import { useLocale } from "../../shared/i18n/locale-provider";
import { exploreTableQuery, tableDisplay } from "./read/explore-table";
import type { MiningRow, BuybackRow } from "./model/explore-display";
import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { readPublicConfig } from "../../shared/config/public-config";
import { getExploreStatistics } from "./api/explore-statistics";
import { exploreSupplyQuery } from "./read/explore-supply";
import { ExplorePage } from "./explore-page";
import { type ReadDisplay } from "./model/explore-display";

function display<T>(query: {
  data?: T;
  isPending: boolean;
  isError: boolean;
}): ReadDisplay<T> {
  if (query.data !== undefined)
    return { status: "populated", value: query.data };
  return {
    status: query.isPending
      ? "loading"
      : query.isError
        ? "error"
        : "unavailable",
  };
}
export function ExploreReadPage({ chainId }: Readonly<{ chainId: number }>) {
  const locale = useLocale();
  const [pages, setPages] = useState({
    mining: 1,
    motherlodes: 1,
    buybacks: 1,
  });
  const client = usePublicClient({ chainId });
  const base = readPublicConfig().apiBaseUrl ?? null;
  const stats = useQuery({
    queryKey: ["explore", base, chainId, "statistics"],
    queryFn: ({ signal }) => getExploreStatistics(signal),
    staleTime: 30_000,
    refetchInterval: 30_000,
    retry: 1,
  });
  const mining = useQuery(
    exploreTableQuery(base, chainId, "mining", pages.mining, locale),
  );
  const motherlodes = useQuery(
    exploreTableQuery(base, chainId, "motherlodes", pages.motherlodes, locale),
  );
  const buybacks = useQuery(
    exploreTableQuery(base, chainId, "buybacks", pages.buybacks, locale),
  );
  const supplyOptions = exploreSupplyQuery(client, chainId);
  const supply = useQuery(supplyOptions);
  const statistic = (key: "maxSupply" | "buried" | "protocolRevenue") =>
    display({
      isPending: stats.isPending,
      isError: stats.isError,
      data: stats.data?.[key],
    });
  return (
    <ExplorePage
      onPageChange={(section, page) =>
        setPages((current) => ({ ...current, [section]: page }))
      }
      model={{
        mining: tableDisplay(mining, pages.mining) as ReturnType<
          typeof tableDisplay<MiningRow>
        >,
        motherlodes: tableDisplay(motherlodes, pages.motherlodes) as ReturnType<
          typeof tableDisplay<MiningRow>
        >,
        buybacks: tableDisplay(buybacks, pages.buybacks) as ReturnType<
          typeof tableDisplay<BuybackRow>
        >,
        statistics: {
          maxSupply: statistic("maxSupply"),
          circulatingSupply: supplyOptions.enabled
            ? display(supply)
            : { status: "unavailable" },
          buried: statistic("buried"),
          protocolRevenue: statistic("protocolRevenue"),
        },
      }}
    />
  );
}
