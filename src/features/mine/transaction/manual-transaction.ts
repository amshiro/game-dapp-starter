import type { Address, Hash } from "viem";
import { manualAmount, manualValue } from "./manual-model";
import { ManualFault, manualError, type ManualError } from "./manual-errors";
export type ManualContext = Readonly<{
  targetChainId: number;
  address?: Address;
  ready: boolean;
  identityPending?: boolean;
  wrongChain: boolean;
}>;
export type ManualOperation = Readonly<{
  account: Address;
  chainId: 97;
  protocol: Address;
  view: Address;
  mask: bigint;
  amountPerSquare: bigint;
  value: bigint;
}>;
export type ManualReceipt = {
  hash: Hash;
  status: "success" | "reverted";
  blockNumber: bigint;
  logs: readonly {
    address: Address;
    data: `0x${string}`;
    topics: readonly `0x${string}`[];
  }[];
};
export type ManualPhase =
  | "idle"
  | "preparing"
  | "awaiting-signature"
  | "submitted"
  | "confirming"
  | "confirmed"
  | "refreshing"
  | "success"
  | "rejected"
  | "failed"
  | "refresh-failed"
  | "verification-failed";
export type ManualState = Readonly<{
  phase: ManualPhase;
  operation?: ManualOperation;
  hash?: Hash;
  operationRound?: bigint;
  chainConfirmed: boolean;
  error?: ManualError;
  confirmationUnknown?: boolean;
}>;
export type ManualDependencies = {
  contracts: { protocol: Address; view: Address };
  context: () => ManualContext;
  prepare: (o: ManualOperation) => Promise<void>;
  send: (o: ManualOperation) => Promise<Hash>;
  wait: (
    o: ManualOperation,
    hash: Hash,
    onHash: (h: Hash) => void,
  ) => Promise<ManualReceipt>;
  verify: (o: ManualOperation, r: ManualReceipt) => bigint;
  refresh: (o: ManualOperation, round: bigint, block: bigint) => Promise<void>;
  refreshBoard: () => Promise<void>;
};
export const manualBusy = (s: ManualState) =>
  [
    "preparing",
    "awaiting-signature",
    "submitted",
    "confirming",
    "confirmed",
    "refreshing",
    "refresh-failed",
    "verification-failed",
  ].includes(s.phase) ||
  !!s.confirmationUnknown ||
  (s.chainConfirmed && s.phase !== "success");
/** Feature-local operation owner, with no wallet or canonical round mirror. */
export class ManualTransaction {
  private state: ManualState = { phase: "idle", chainConfirmed: false };
  private listeners = new Set<() => void>();
  private receipt?: ManualReceipt;
  constructor(private readonly deps: ManualDependencies) {}
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private set(s: Partial<ManualState>) {
    this.state = { ...this.state, ...s };
    for (const f of this.listeners) f();
  }
  private current(o?: ManualOperation) {
    const c = this.deps.context();
    if (c.targetChainId !== 97 || c.wrongChain)
      throw new ManualFault("wrong-chain");
    if (!c.ready || !c.address) throw new ManualFault("disconnected");
    if (o && o.account.toLowerCase() !== c.address.toLowerCase())
      throw new ManualFault("account-changed");
    return c.address;
  }
  private async fail(error: unknown) {
    const kind = manualError(error);
    this.set({
      phase: kind === "user-rejected" ? "rejected" : "failed",
      error: kind,
      confirmationUnknown: kind === "confirmation-unknown",
    });
    if (kind === "checkpoint-required") {
      try {
        await this.deps.refreshBoard();
      } catch {
        /* Keep the actionable checkpoint error; never send a repair transaction. */
      }
    }
  }
  async start(mask: bigint, input: string) {
    if (manualBusy(this.state)) return;
    this.state = { phase: "preparing", chainConfirmed: false };
    this.set({});
    this.receipt = undefined;
    try {
      const amountPerSquare = manualAmount(input);
      // Capture signing intent before any async work; no expected/stored round is a transaction argument.
      const operation: ManualOperation = Object.freeze({
        account: this.current(),
        chainId: 97,
        ...this.deps.contracts,
        mask,
        amountPerSquare,
        value: manualValue(mask, amountPerSquare),
      });
      this.set({ operation });
      await this.deps.prepare(operation);
      this.current(operation);
      this.set({ phase: "awaiting-signature" });
      this.current(operation);
      const hash = await this.deps.send(operation);
      this.set({ phase: "submitted", hash }); // Hash is submission, never business success.
      await this.confirm(operation, hash);
      await this.finish();
    } catch (e) {
      if (!["refresh-failed", "verification-failed"].includes(this.state.phase))
        await this.fail(e);
    }
  }
  private async confirm(o: ManualOperation, hash: Hash) {
    this.set({ phase: "confirming" });
    let r: ManualReceipt;
    try {
      r = await this.deps.wait(o, hash, (h) => this.set({ hash: h }));
    } catch (e) {
      if (e instanceof ManualFault && e.kind === "replaced") throw e;
      throw new ManualFault("confirmation-unknown");
    }
    this.set({ hash: r.hash });
    if (r.status !== "success") throw new ManualFault("receipt-reverted");
    this.receipt = r;
    this.set({
      phase: "confirmed",
      chainConfirmed: true,
      confirmationUnknown: false,
    });
  }
  private async finish() {
    const o = this.state.operation,
      r = this.receipt;
    if (!o || !r) return;
    let round: bigint;
    try {
      round = this.deps.verify(o, r);
      this.set({ operationRound: round });
    } catch {
      this.set({ phase: "verification-failed", error: "verification-failed" });
      return;
    }
    this.set({ phase: "refreshing", error: undefined });
    try {
      await this.deps.refresh(o, round, r.blockNumber);
      this.set({ phase: "success" });
    } catch {
      this.set({ phase: "refresh-failed", error: "refresh-failed" });
    }
  }
  async retryReads() {
    if (!["refresh-failed", "verification-failed"].includes(this.state.phase))
      return;
    this.set({ phase: "confirmed", error: undefined });
    // Confirmed transactions are never resent. Re-fetch/re-verify the original receipt and reads only.
    try {
      await this.finish();
    } catch (e) {
      await this.fail(e);
    }
  }
  async retryConfirmation() {
    const { operation: o, hash } = this.state;
    if (!o || !hash || !this.state.confirmationUnknown) return;
    this.set({ confirmationUnknown: false, error: undefined });
    try {
      await this.confirm(o, hash);
      await this.finish();
    } catch (e) {
      await this.fail(e);
    }
  }
}
