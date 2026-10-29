"use client";
import { useLayoutEffect, useState, useSyncExternalStore } from "react";
import type { PublicClient } from "viem";
import { useConfig, usePublicClient } from "wagmi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { StakeReadContext } from "../read/stake-read-context";
import { createStakeAllowanceQuery } from "../read/stake-allowance";
import { createStakeTxDependencies } from "./runtime";
import { StakeTransaction, stakeTxBusy } from "./stake-transaction";

// Execution guard callbacks point at the latest committed render, never a wallet/query store.
class CommittedStakeRuntime {
  private currentContext: () => StakeReadContext = () => ({
    targetChainId: 97,
    account: { status: "unavailable" },
  });
  private currentClient: () => PublicClient | undefined = () => undefined;
  private mounted = false;
  commit(
    context: () => StakeReadContext,
    client: () => PublicClient | undefined,
  ) {
    this.currentContext = context;
    this.currentClient = client;
    this.mounted = true;
  }
  unmount() {
    this.mounted = false;
  }
  context = () =>
    this.mounted
      ? this.currentContext()
      : { targetChainId: 97, account: { status: "unavailable" as const } };
  client = () => this.currentClient();
}

export function useStakeTransaction(context: StakeReadContext) {
  const client = usePublicClient({ chainId: 97 }),
    config = useConfig(),
    queryClient = useQueryClient();
  const [boundary] = useState(() => new CommittedStakeRuntime());
  useLayoutEffect(() => {
    boundary.commit(
      () => context,
      () => client,
    );
    return () => boundary.unmount();
  }, [boundary, context, client]);
  const [owner] = useState(
    () =>
      new StakeTransaction(
        createStakeTxDependencies({
          config,
          queryClient,
          client: boundary.client,
          context: boundary.context,
        }),
      ),
  );
  const state = useSyncExternalStore(
    owner.subscribe,
    owner.getSnapshot,
    owner.getSnapshot,
  );
  const allowanceOptions = createStakeAllowanceQuery(client, context);
  const allowance = useQuery(allowanceOptions);
  return {
    state,
    busy: stakeTxBusy(state),
    allowance: allowance.isError ? undefined : allowance.data,
    allowanceLoading: allowance.isPending,
    allowanceError: allowance.isError,
    refreshAllowance: () => {
      if (allowanceOptions.enabled) void allowance.refetch();
    },
    start: (kind: "deposit" | "withdraw", input: string) =>
      owner.start(kind, input),
    retryRefresh: () => owner.retryRefresh(),
    retryConfirmation: () => owner.retryConfirmation(),
  };
}
export type StakeTransactionUI = ReturnType<typeof useStakeTransaction>;
