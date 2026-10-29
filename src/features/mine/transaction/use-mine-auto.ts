"use client";
import { useLayoutEffect, useState, useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useBalance, useConfig, usePublicClient } from "wagmi";
import type { PublicClient } from "viem";
import { createAutomationQueries } from "../read/mine-automation-queries";
import { mineAmount } from "../read/mine-display";
import type { ManualContext } from "./manual-transaction";
import {
  autoIntent,
  autoError,
  type AutoError,
  type AutoIntent,
} from "./auto-model";
import { AutoTransaction, autoBusy } from "./auto-transaction";
import { createAutoDependencies } from "./auto-runtime";
import type { BettingPresentation } from "../model/mine-presentation";
import type { manualAmountShortcuts } from "./manual-model";
// Publish committed context to asynchronous operations; abandoned renders must never change a signing snapshot.
class AutoRuntimeBoundary {
  private value: { context: ManualContext; client: PublicClient | undefined } =
    {
      context: { targetChainId: 97, ready: false, wrongChain: false },
      client: undefined,
    };
  commit(context: ManualContext, client: PublicClient | undefined) {
    this.value = { context, client };
  }
  unmount() {
    this.value = {
      context: { targetChainId: 97, ready: false, wrongChain: false },
      client: undefined,
    };
  }
  client = () => this.value.client;
  context = () => this.value.context;
}
export function useMineAuto(
  context: ManualContext,
  selected: readonly number[],
  otherBusy: boolean,
  onConnect?: () => void,
) {
  const config = useConfig(),
    client = usePublicClient({ chainId: 97 }),
    queryClient = useQueryClient();
  const [boundary] = useState(() => new AutoRuntimeBoundary());
  useLayoutEffect(() => {
    boundary.commit(context, client);
    return () => boundary.unmount();
  }, [boundary, context, client]);
  const [owner] = useState(
    () =>
      new AutoTransaction(
        createAutoDependencies({
          client: boundary.client,
          context: boundary.context,
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
    busy = autoBusy(state);
  const connected =
    context.targetChainId === 97 &&
    context.ready &&
    !context.wrongChain &&
    !!context.address;
  const q = createAutomationQueries(client, context.address, connected);
  const chain = useQuery(q.account),
    fee = useQuery(q.config),
    backend = useQuery(q.enrichment);
  const native = useBalance({
    address: context.address,
    chainId: 97,
    query: { enabled: connected, staleTime: 30_000, retry: 1 },
  });
  const [input, setInput] = useState(""),
    [blocks, setBlocks] = useState("0"),
    [rounds, setRounds] = useState("1");
  const automation = connected && !chain.isError ? chain.data : undefined,
    executorFee = connected && !fee.isError ? fee.data : undefined;
  const balance = connected && !native.isError ? native.data?.value : undefined;
  let intent: AutoIntent | undefined, error: AutoError | undefined;
  if (input && executorFee !== undefined) {
    try {
      intent = autoIntent(selected, blocks, rounds, input, executorFee);
    } catch (e) {
      error = autoError(e);
    }
  }
  if (connected && !error && (chain.isError || fee.isError || native.isError))
    error = "rpc-error";
  const insufficient =
    balance !== undefined && intent !== undefined && balance <= intent.value;
  const canSubmit =
    connected &&
    automation?.active === false &&
    !!intent &&
    balance !== undefined &&
    !insufficient &&
    !busy &&
    !otherBusy;
  const display: BettingPresentation = {
    amount: input,
    blocks: selected.length ? String(selected.length) : blocks,
    rounds,
    selectedBlocks: selected.length
      ? selected.map((i) => `#${i + 1}`).join(", ")
      : blocks === "0"
        ? undefined
        : `× ${blocks}`,
    totalPerRound: intent ? mineAmount(intent.roundPrincipal).exact : undefined,
    total: intent ? mineAmount(intent.displayTotal).exact : undefined,
    balance: balance === undefined ? undefined : mineAmount(balance).text,
    appearance: !context.address
      ? "disconnected"
      : insufficient
        ? "insufficient"
        : canSubmit
          ? "ready"
          : "unavailable",
  };
  return {
    state,
    loading:
      connected && (chain.isPending || fee.isPending || native.isPending),
    busy,
    formBusy: busy || otherBusy,
    input,
    display,
    error,
    intent,
    executorFee,
    setInput,
    setBlocks,
    setRounds,
    fixed: !!selected.length,
    setShortcut: (value: (typeof manualAmountShortcuts)[number]) => {
      if (!busy && !otherBusy) setInput(value);
    },
    canSubmit,
    onConnect,
    submit: () => {
      if (canSubmit && intent) void owner.start("register", intent);
    },
    active: automation?.active === true,
    accountReady: automation !== undefined,
    running: automation?.active
      ? {
          blocks: automation.randomizeMask
            ? `× ${automation.mask}`
            : Array.from({ length: 25 }, (_, n) => n)
                .filter((n) => !!(automation.mask & (BigInt(1) << BigInt(n))))
                .map((n) => `#${n + 1}`)
                .join(", "),
          random: automation.randomizeMask,
          roundsRemaining: !backend.isError
            ? backend.data?.remaining
            : undefined,
          totalPerRound: mineAmount(
            automation.amountPerSquare *
              (automation.randomizeMask
                ? automation.mask
                : BigInt(automation.mask.toString(2).replace(/0/g, "").length)),
          ).exact,
        }
      : undefined,
    stop: () => {
      if (connected && automation?.active && !busy && !otherBusy)
        void owner.start("stop");
    },
    canStop: connected && automation?.active === true && !busy && !otherBusy,
    stateVisible:
      !state.operation ||
      (connected &&
        state.operation.account.toLowerCase() ===
          context.address?.toLowerCase()),
    retry: () => owner.retry(),
    refresh: () => {
      if (connected) {
        void chain.refetch();
        void fee.refetch();
        void backend.refetch();
        void native.refetch();
      }
    },
  };
}
export type MineAutoUI = ReturnType<typeof useMineAuto>;
