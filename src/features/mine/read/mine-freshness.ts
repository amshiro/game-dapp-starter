/** Mine route read budgets, not protocol clocks or transaction/retry permissions. */
const intervals = {
  board: 15_000,
  motherlode: 30_000,
  account: 30_000,
  automation: 30_000,
  executorFee: 60_000,
  enrichment: 30_000,
  rewards: 30_000,
  nativeBalance: 30_000,
} as const;
export function mineReadFreshness(
  resource: keyof typeof intervals,
  enabled: boolean,
) {
  return {
    refetchInterval: (query: {
      state: { fetchFailureCount: number };
    }): number | false =>
      enabled
        ? Math.min(
            intervals[resource] *
              2 ** Math.min(query.state.fetchFailureCount, 3),
            120_000,
          )
        : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: "always" as const,
    refetchOnReconnect: "always" as const,
  };
}
