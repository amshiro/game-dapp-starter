"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { useLocale } from "../../shared/i18n/locale-provider";
import { readPublicConfig } from "../../shared/config/public-config";
import { getPointsRecords, getPointsTotal } from "./api/points-api";
import { PointsPage } from "./points-page";

export function PointsReadPage({
  account,
  chainId,
  accountLoading = false,
}: Readonly<{ account?: Address; chainId: number; accountLoading?: boolean }>) {
  const locale = useLocale();
  const scope = `${chainId}:${account ?? ""}`;
  const [paging, setPaging] = useState({ scope, page: 1 });
  const page = paging.scope === scope ? paging.page : 1;
  const base = readPublicConfig().apiBaseUrl ?? null;
  const enabled = !!account && chainId === 97;
  const total = useQuery({
    queryKey: ["points", base, chainId, account, "total"],
    enabled,
    staleTime: 30_000,
    retry: 1,
    queryFn: ({ signal }) => {
      if (!account || chainId !== 97) throw Error("Points account unavailable");
      return getPointsTotal(account, signal);
    },
  });
  const records = useQuery({
    queryKey: ["points", base, chainId, account, "records", locale, page],
    enabled,
    staleTime: 30_000,
    retry: 1,
    queryFn: ({ signal }) => {
      if (!account || chainId !== 97) throw Error("Points account unavailable");
      return getPointsRecords(account, locale, signal, page);
    },
  });
  return (
    <PointsPage
      locale={locale}
      status={
        accountLoading
          ? "loading"
          : !enabled
            ? "unavailable"
            : records.isFetching || records.isPending
              ? "loading"
              : records.isError
                ? "error"
                : records.data?.records.length
                  ? "populated"
                  : "empty"
      }
      pagination={
        records.data
          ? { currentPage: page, total: records.data.total, pageSize: 20 }
          : undefined
      }
      onPageChange={(next) => setPaging({ scope, page: next })}
      model={{
        total: enabled
          ? ((!total.isError ? total.data : undefined) ??
            (!records.isError ? records.data?.totalPoints : undefined) ??
            "—")
          : "—",
        records:
          enabled && !records.isError ? (records.data?.records ?? []) : [],
      }}
    />
  );
}
