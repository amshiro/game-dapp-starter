"use client";
import { useLayoutEffect, useState, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useConfig, usePublicClient } from "wagmi";
import type { PublicClient } from "viem";
import type { ManualContext } from "./manual-transaction";
import type { MineRewardsDisplay } from "../model/mine-rewards";
import type { ClaimKind } from "./claim-model";
import { ClaimTransaction, claimBusy } from "./claim-transaction";
import { createClaimDependencies } from "./claim-runtime";
class ClaimRuntimeBoundary {
  private value: {
    context: ManualContext;
    client?: PublicClient;
    otherBusy: boolean;
  } = {
    context: { targetChainId: 97, ready: false, wrongChain: false },
    otherBusy: false,
  };
  commit(
    context: ManualContext,
    client: PublicClient | undefined,
    otherBusy: boolean,
  ) {
    this.value = { context, client, otherBusy };
  }
  unmount() {
    this.value = {
      context: { targetChainId: 97, ready: false, wrongChain: false },
      otherBusy: false,
    };
  }
  context = () => this.value.context;
  client = () => this.value.client;
  otherBusy = () => this.value.otherBusy;
}
export function useMineClaim(
  context: ManualContext,
  display: MineRewardsDisplay,
  otherBusy: boolean,
) {
  const config = useConfig(),
    queryClient = useQueryClient(),
    client = usePublicClient({ chainId: 97 });
  const [boundary] = useState(() => new ClaimRuntimeBoundary());
  useLayoutEffect(() => {
    boundary.commit(context, client, otherBusy);
    return () => boundary.unmount();
  }, [boundary, context, client, otherBusy]);
  const [owner] = useState(
    () =>
      new ClaimTransaction(
        createClaimDependencies({
          client: boundary.client,
          context: boundary.context,
          otherBusy: boundary.otherBusy,
          config,
          queryClient,
        }),
      ),
  );
  const state = useSyncExternalStore(
      owner.subscribe,
      owner.getSnapshot,
      owner.getSnapshot,
    ),
    busy = claimBusy(state);
  const connected =
    context.targetChainId === 97 &&
    context.ready &&
    !context.wrongChain &&
    !!context.address;
  const available =
    connected && !busy && !otherBusy && display.status === "populated";
  const canClaimAll =
    available && display.status === "populated" && display.showClaimAll;
  const canClaimEth =
    available && display.status === "populated" && display.showClaimEth;
  return {
    state,
    busy,
    stateVisible:
      !state.operation ||
      (connected &&
        state.operation.account.toLowerCase() ===
          context.address?.toLowerCase()),
    canClaimAll,
    canClaimEth,
    submit: (kind: ClaimKind) => {
      if (kind === "claimAll" ? canClaimAll : canClaimEth)
        void owner.start(kind);
    },
    retry: () => owner.retry(),
  };
}
export type MineClaimUI = ReturnType<typeof useMineClaim>;
