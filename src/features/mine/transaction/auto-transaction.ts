import type { Address, Hash } from "viem";
import type {
  ManualContext,
  ManualPhase,
  ManualReceipt,
} from "./manual-transaction";
import {
  AutoFault,
  autoError,
  type AutoError,
  type AutoIntent,
} from "./auto-model";
export type AutoOperation = Readonly<{
  kind: "register" | "stop";
  account: Address;
  chainId: 97;
  protocol: Address;
  intent?: AutoIntent;
}>;
export type AutoState = Readonly<{
  phase: ManualPhase;
  chainConfirmed: boolean;
  operation?: AutoOperation;
  hash?: Hash;
  error?: AutoError;
  confirmationUnknown?: boolean;
}>;
export type AutoDependencies = {
  protocol: Address;
  context: () => ManualContext;
  prepare: (o: AutoOperation) => Promise<void>;
  send: (o: AutoOperation) => Promise<Hash>;
  wait: (
    o: AutoOperation,
    hash: Hash,
    onHash: (h: Hash) => void,
  ) => Promise<ManualReceipt>;
  verify: (o: AutoOperation, receipt: ManualReceipt) => void;
  refresh: (o: AutoOperation, block: bigint) => Promise<void>;
};
export const autoBusy = (s: AutoState) =>
  !["idle", "success", "rejected", "failed"].includes(s.phase) ||
  !!s.confirmationUnknown ||
  (s.chainConfirmed && s.phase !== "success");
/** Mine-local register/stop operation owner; canonical automation remains Query-owned. */
export class AutoTransaction {
  private state: AutoState = { phase: "idle", chainConfirmed: false };
  private receipt?: ManualReceipt;
  private listeners = new Set<() => void>();
  constructor(private readonly deps: AutoDependencies) {}
  getSnapshot = () => this.state;
  subscribe = (f: () => void) => {
    this.listeners.add(f);
    return () => {
      this.listeners.delete(f);
    };
  };
  private set(s: Partial<AutoState>) {
    this.state = { ...this.state, ...s };
    for (const f of this.listeners) f();
  }
  private current(o?: AutoOperation) {
    const c = this.deps.context();
    if (c.targetChainId !== 97 || c.wrongChain)
      throw new AutoFault("wrong-chain");
    if (!c.ready || !c.address) throw new AutoFault("disconnected");
    if (o && o.account.toLowerCase() !== c.address.toLowerCase())
      throw new AutoFault("account-changed");
    return c.address;
  }
  private fail(e: unknown) {
    const error = autoError(e);
    this.set({
      phase: error === "user-rejected" ? "rejected" : "failed",
      error,
      confirmationUnknown: error === "confirmation-unknown",
    });
  }
  async start(kind: AutoOperation["kind"], intent?: AutoIntent) {
    if (autoBusy(this.state)) return;
    this.state = { phase: "preparing", chainConfirmed: false };
    this.set({});
    this.receipt = undefined;
    try {
      if (kind === "register" && !intent) throw new AutoFault("invalid-amount");
      // Freeze the original account/deployment and full fixed/random funding intent before async preflight.
      const operation: AutoOperation = Object.freeze({
        kind,
        account: this.current(),
        chainId: 97,
        protocol: this.deps.protocol,
        intent,
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
  private async confirm(o: AutoOperation, hash: Hash) {
    this.set({ phase: "confirming" });
    let receipt: ManualReceipt;
    try {
      receipt = await this.deps.wait(o, hash, (h) => this.set({ hash: h }));
    } catch (e) {
      if (e instanceof AutoFault && e.kind === "replaced") throw e;
      throw new AutoFault("confirmation-unknown");
    }
    this.set({ hash: receipt.hash });
    if (receipt.status !== "success") throw new AutoFault("receipt-reverted");
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
