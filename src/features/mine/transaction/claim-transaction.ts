import type { Address, Hash } from "viem";
import type {
  ManualContext,
  ManualPhase,
  ManualReceipt,
} from "./manual-transaction";
import {
  ClaimFault,
  claimError,
  type ClaimError,
  type ClaimKind,
} from "./claim-model";
export type ClaimOperation = Readonly<{
  kind: ClaimKind;
  account: Address;
  chainId: 97;
  protocol: Address;
}>;
export type ClaimState = Readonly<{
  phase: ManualPhase;
  chainConfirmed: boolean;
  operation?: ClaimOperation;
  hash?: Hash;
  error?: ClaimError;
  confirmationUnknown?: boolean;
}>;
export type ClaimDependencies = {
  protocol: Address;
  context: () => ManualContext;
  prepare: (o: ClaimOperation) => Promise<void>;
  send: (o: ClaimOperation) => Promise<Hash>;
  wait: (
    o: ClaimOperation,
    hash: Hash,
    onHash: (h: Hash) => void,
  ) => Promise<ManualReceipt>;
  verify: (o: ClaimOperation, receipt: ManualReceipt) => void;
  refresh: (o: ClaimOperation, block: bigint) => Promise<void>;
};
export const claimBusy = (s: ClaimState) =>
  !["idle", "success", "rejected", "failed"].includes(s.phase) ||
  !!s.confirmationUnknown ||
  (s.chainConfirmed && s.phase !== "success");
/** Mine-local claim operation owner; rewards and balances remain Query-owned. */
export class ClaimTransaction {
  private state: ClaimState = { phase: "idle", chainConfirmed: false };
  private receipt?: ManualReceipt;
  private listeners = new Set<() => void>();
  constructor(private readonly deps: ClaimDependencies) {}
  getSnapshot = () => this.state;
  subscribe = (f: () => void) => {
    this.listeners.add(f);
    return () => {
      this.listeners.delete(f);
    };
  };
  private set(s: Partial<ClaimState>) {
    this.state = { ...this.state, ...s };
    for (const f of this.listeners) f();
  }
  private current(o?: ClaimOperation) {
    const c = this.deps.context();
    if (c.targetChainId !== 97 || c.wrongChain)
      throw new ClaimFault("wrong-chain");
    if (!c.ready || !c.address) throw new ClaimFault("disconnected");
    if (o && o.account.toLowerCase() !== c.address.toLowerCase())
      throw new ClaimFault("account-changed");
    return c.address;
  }
  private fail(e: unknown) {
    const error = claimError(e);
    this.set({
      phase: error === "user-rejected" ? "rejected" : "failed",
      error,
      confirmationUnknown: error === "confirmation-unknown",
    });
  }
  async start(kind: ClaimKind) {
    if (claimBusy(this.state)) return;
    this.state = { phase: "preparing", chainConfirmed: false };
    this.set({});
    this.receipt = undefined;
    try {
      // Freeze the original account, chain, deployment and action before any asynchronous claim checks.
      const operation: ClaimOperation = Object.freeze({
        kind,
        account: this.current(),
        chainId: 97,
        protocol: this.deps.protocol,
      });
      this.set({ operation });
      await this.deps.prepare(operation);
      this.current(operation);
      this.set({ phase: "awaiting-signature" });
      this.current(operation);
      const hash = await this.deps.send(operation);
      this.set({ phase: "submitted", hash }); // Submission is not business success.
      await this.confirm(operation, hash);
      await this.finish();
    } catch (e) {
      if (!["refresh-failed", "verification-failed"].includes(this.state.phase))
        this.fail(e);
    }
  }
  private async confirm(o: ClaimOperation, hash: Hash) {
    this.set({ phase: "confirming" });
    let receipt: ManualReceipt;
    try {
      receipt = await this.deps.wait(o, hash, (h) => this.set({ hash: h }));
    } catch (e) {
      if (e instanceof ClaimFault && e.kind === "replaced") throw e;
      throw new ClaimFault("confirmation-unknown");
    }
    this.set({ hash: receipt.hash });
    if (receipt.status !== "success") throw new ClaimFault("receipt-reverted");
    this.receipt = receipt;
    this.set({
      phase: "confirmed",
      chainConfirmed: true,
      confirmationUnknown: false,
    });
  }
  private async finish() {
    const o = this.state.operation,
      receipt = this.receipt;
    if (!o || !receipt) return;
    try {
      this.deps.verify(o, receipt);
    } catch {
      this.set({ phase: "verification-failed", error: "verification-failed" });
      return;
    }
    this.set({ phase: "refreshing", error: undefined });
    try {
      await this.deps.refresh(o, receipt.blockNumber);
      this.set({ phase: "success" });
    } catch {
      this.set({ phase: "refresh-failed", error: "refresh-failed" });
    }
  }
  async retry() {
    const { operation, hash, confirmationUnknown, phase } = this.state;
    if (
      !operation ||
      !hash ||
      (!confirmationUnknown &&
        !["refresh-failed", "verification-failed"].includes(phase))
    )
      return;
    // Once confirmed, retry only receipt verification / reads. Never send again after any refresh failure.
    try {
      if (confirmationUnknown) {
        this.set({ confirmationUnknown: false, error: undefined });
        await this.confirm(operation, hash);
      }
      await this.finish();
    } catch (e) {
      this.fail(e);
    }
  }
}
