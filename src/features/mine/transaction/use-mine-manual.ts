"use client";
import { useLayoutEffect, useState, useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useBalance, useConfig, usePublicClient } from "wagmi";
import type { PublicClient } from "viem";
import { createMineAccountQueries } from "../read/mine-account-queries";
import type { MineBoardSnapshot } from "../read/mine-read-query";
import { createManualDependencies } from "./manual-runtime";
import {
  ManualTransaction,
  manualBusy,
  type ManualContext,
} from "./manual-transaction";
import {
  cellMask,
  manualAmountShortcuts,
  manualAmount,
  manualValue,
  reconcileSelection,
  manualParticipation,
  toggleCell,
} from "./manual-model";
import { manualError, type ManualError } from "./manual-errors";
import { mineAmount } from "../read/mine-display";
import type { BettingPresentation } from "../model/mine-presentation";

class CommittedManualRuntime {
  private getContext: () => ManualContext = () => ({
    targetChainId: 97,
    ready: false,
    wrongChain: false,
  });
  private getClient: () => PublicClient | undefined = () => undefined;
  private mounted = false;
  commit(context: () => ManualContext, client: () => PublicClient | undefined) {
    this.getContext = context;
    this.getClient = client;
    this.mounted = true;
  }
  unmount() {
    this.mounted = false;
  }
  context = () =>
    this.mounted
      ? this.getContext()
      : { targetChainId: 97, ready: false, wrongChain: false };
  client = () => this.getClient();
}
export function useMineManual(
  context: ManualContext,
  snapshot: MineBoardSnapshot | undefined,
  onConnect?: () => void,
) {
  const config = useConfig(),
    client = usePublicClient({ chainId: 97 }),
    queryClient = useQueryClient();
  const [boundary] = useState(() => new CommittedManualRuntime());
  useLayoutEffect(() => {
    boundary.commit(
      () => context,
      () => client,
    );
    return () => boundary.unmount();
  }, [boundary, context, client]);
  const [owner] = useState(
    () =>
      new ManualTransaction(
        createManualDependencies({
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
    busy = manualBusy(state);
  const connected =
    context.ready && !context.wrongChain && context.targetChainId === 97;
  // A fulfilled stored board is historical: its owned cells cannot prohibit selection for the next deployable round.
  const ownRelevant = snapshot?.randomnessFulfilled === false;
  const personal = createMineAccountQueries(client, {
    chainId: context.targetChainId,
    account: context.address,
    roundId: snapshot?.roundId,
    enabled: connected && snapshot !== undefined,
  });
  const info = useQuery(personal.info),
    squares = useQuery(personal.squares);
  const native = useBalance({
    address: context.address,
    chainId: 97,
    query: {
      enabled: connected && !!context.address,
      staleTime: 30_000,
      retry: 1,
    },
  });
  const own =
      connected && ownRelevant && !squares.isError ? squares.data : undefined,
    ownMask = own?.mask ?? BigInt(0);
  const hasDeployed = manualParticipation(
    snapshot?.randomnessFulfilled,
    connected && !info.isError ? info.data : undefined,
    connected && !squares.isError ? squares.data : undefined,
  );
  const scope = {
    account: context.address?.toLowerCase(),
    round: snapshot
      ? `${context.targetChainId}:${snapshot.roundId}`
      : undefined,
  };
  const [draft, setDraft] = useState(() => ({
    scope,
    selected: [] as readonly number[],
  }));
  const reconciled = reconcileSelection(draft.scope, scope, draft.selected),
    selected = reconciled.selected;
  // Adjust only this UI draft when known identity changes; unavailable/wrong-chain data does not manufacture a new round.
  if (
    reconciled.scope.account !== draft.scope.account ||
    reconciled.scope.round !== draft.scope.round ||
    selected.length !== draft.selected.length
  )
    setDraft({ scope: reconciled.scope, selected });
  const [input, setInput] = useState("");
  let raw: bigint | undefined,
    total: bigint | undefined,
    error: ManualError | undefined;
  try {
    if (input) raw = manualAmount(input);
    if (raw && selected.length) total = manualValue(cellMask(selected), raw);
  } catch (e) {
    error = manualError(e);
  }
  if (connected && native.isError && !error) error = "rpc-error";
  const balance = connected && !native.isError ? native.data?.value : undefined;
  const insufficient =
    balance !== undefined && total !== undefined && balance <= total;
  const canSubmit =
    connected &&
    snapshot?.live === true &&
    snapshot.canDeploy === true &&
    hasDeployed === false &&
    !busy &&
    !error &&
    total !== undefined &&
    balance !== undefined &&
    !insufficient;
  const appearance: BettingPresentation["appearance"] = !context.address
    ? "disconnected"
    : !selected.length
      ? "no-selection"
      : insufficient
        ? "insufficient"
        : canSubmit
          ? "ready"
          : "unavailable";
  const ownAmounts = new Map(own?.indices.map((i, n) => [i, own.amounts[n]]));
  const display: BettingPresentation = {
    appearance,
    amount: input,
    balance: balance === undefined ? undefined : mineAmount(balance).text,
    blocks: selected.length.toString(),
    total: total === undefined ? undefined : mineAmount(total).exact,
  };
  return {
    state,
    busy,
    hasDeployedThisRound: hasDeployed,
    // Product deploy limits gate submission only; local draft editing stays available.
    selectionEnabled: !busy,
    stateVisible:
      !state.operation ||
      (connected &&
        context.address?.toLowerCase() ===
          state.operation.account.toLowerCase()),
    input,
    setInput,
    setShortcut: (value: (typeof manualAmountShortcuts)[number]) => {
      // Presets edit local per-cell intent only, including deployed/disconnected/wrong-chain states.
      if (!busy) setInput(value);
    },
    selected,
    ownMask,
    ownAmounts,
    raw,
    error,
    balance,
    display,
    toggle: (index: number) => {
      if (!busy)
        setDraft({
          scope: reconciled.scope,
          selected: toggleCell(selected, index),
        });
    },
    canSubmit,
    onConnect,
    submit: () => {
      if (canSubmit) void owner.start(cellMask(selected), input);
    },
    retry: () =>
      state.confirmationUnknown
        ? owner.retryConfirmation()
        : owner.retryReads(),
    refresh: () => {
      if (connected) {
        void native.refetch();
        if (personal.info.enabled) void info.refetch();
        if (personal.squares.enabled) void squares.refetch();
      }
    },
  };
}
export type MineManualUI = ReturnType<typeof useMineManual>;
