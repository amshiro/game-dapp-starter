import type { QueryClient, QueryKey } from "@tanstack/react-query";
import type { ManualContext } from "../transaction/manual-transaction";
import type { MineBoardSnapshot } from "../read/mine-read-query";
import { createMineBoardQuery } from "../read/mine-read-query";
import { createMineAccountQueries } from "../read/mine-account-queries";
import { createAutomationQueries } from "../read/mine-automation-queries";
import { createMineRewardsQuery } from "../read/mine-rewards-query";
import { createMineWinnersQuery } from "../read/mine-winners-query";
export function mineRealtimeReadKeys(
  context: ManualContext,
  snapshot?: MineBoardSnapshot,
): readonly QueryKey[] {
  if (context.targetChainId !== 97 || context.wrongChain) return [];
  const keys: QueryKey[] = [
    createMineBoardQuery(undefined, context).queryKey,
    createMineWinnersQuery(context, snapshot).queryKey,
  ];
  if (context.ready && context.address) {
    const own = createMineAccountQueries(undefined, {
      chainId: 97,
      account: context.address,
      roundId: snapshot?.roundId,
      enabled: false,
    });
    const auto = createAutomationQueries(undefined, context.address, false);
    keys.push(
      auto.account.queryKey,
      auto.config.queryKey,
      auto.enrichment.queryKey,
      createMineRewardsQuery(undefined, context).queryKey,
    );
    if (snapshot) keys.push(own.info.queryKey, own.squares.queryKey);
  }
  return keys;
}
/** Signals only schedule canonical reads. Payloads/round IDs never patch the board, rewards, selection or transaction state. */
export class MineRealtimeRefresh {
  private timer: ReturnType<typeof setTimeout> | undefined;
  private client: QueryClient | undefined;
  private keys: readonly QueryKey[] = [];
  private scope = "";
  private lastFlush = Number.NEGATIVE_INFINITY;
  constructor(
    private readonly visible = () =>
      typeof document === "undefined" || document.visibilityState !== "hidden",
  ) {}
  configure(client: QueryClient, keys: readonly QueryKey[]) {
    const scope = JSON.stringify(keys);
    if (this.client !== client || this.scope !== scope) {
      this.cancel();
      this.scope = scope;
      this.keys = keys;
      this.client = client;
    }
  }
  signal = () => {
    if (this.timer !== undefined || !this.client || !this.keys.length) return;
    // Coalesce duplicate/out-of-order notifications and bound bursts; this clock has no protocol meaning.
    this.timer = setTimeout(
      () => {
        this.timer = undefined;
        this.lastFlush = Date.now();
        for (const queryKey of this.keys) {
          // Existing Query owners retain read errors. Avoid cancelling their in-flight preflight/receipt refreshes.
          void this.client?.invalidateQueries(
            {
              queryKey,
              exact: true,
              refetchType: this.visible() ? "active" : "none",
            },
            { cancelRefetch: false },
          );
        }
      },
      Math.max(250, 5000 - (Date.now() - this.lastFlush)),
    );
  };
  private cancel() {
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
  }
  dispose() {
    this.cancel();
    this.client = undefined;
    this.keys = [];
    this.scope = "";
  }
}
