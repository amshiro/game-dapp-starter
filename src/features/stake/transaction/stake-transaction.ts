import type { Address, Hash } from "viem";
import type { StakeReadContext } from "../read/stake-read-context";
import { parseStakeAmount } from "./amount";
import { StakeTxFault, stakeTxError, type StakeTxError } from "./errors";

export type StakeStep = "approve" | "deposit" | "withdraw";
export type StakePhase =
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
  | "refresh-failed";
export type StakeOperation = Readonly<{
  account: Address;
  chainId: 97;
  amount: bigint;
  kind: "deposit" | "withdraw";
  token: Address;
  protocol: Address;
  view: Address;
}>;
export type StakeTxState = Readonly<{
  phase: StakePhase;
  step?: StakeStep;
  operation?: StakeOperation;
  hash?: Hash;
  approvalHash?: Hash;
  chainConfirmed: boolean;
  error?: StakeTxError;
  confirmationUnknown?: boolean;
}>;
export type StakeReceipt = {
  hash: Hash;
  status: "success" | "reverted";
  blockNumber: bigint;
};
export type StakeTxDependencies = {
  contracts: { token: Address; protocol: Address; view: Address };
  context: () => StakeReadContext;
  read: (
    operation: StakeOperation,
  ) => Promise<{ available: bigint; staked: bigint; allowance: bigint }>;
  simulate: (operation: StakeOperation, step: StakeStep) => Promise<void>;
  send: (operation: StakeOperation, step: StakeStep) => Promise<Hash>;
  wait: (
    operation: StakeOperation,
    step: StakeStep,
    hash: Hash,
    onHash: (hash: Hash) => void,
  ) => Promise<StakeReceipt>;
  refresh: (
    operation: StakeOperation,
    step: StakeStep,
    block: bigint,
  ) => Promise<void>;
};
export const stakeTxBusy = (s: StakeTxState) =>
  [
    "preparing",
    "awaiting-signature",
    "submitted",
    "confirming",
    "confirmed",
    "refreshing",
    "refresh-failed",
  ].includes(s.phase) || !!s.confirmationUnknown;

/** One Feature-local operation owner. Provider identity is always read, never copied into a store. */
export class StakeTransaction {
  private state: StakeTxState = { phase: "idle", chainConfirmed: false };
  private listeners = new Set<() => void>();
  private receipt?: StakeReceipt;
  // Approval briefly reaches success before Deposit preflight; keep the entire operation exclusive.
  private running = false;
  constructor(private readonly deps: StakeTxDependencies) {}
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private set(next: Partial<StakeTxState>) {
    this.state = { ...this.state, ...next };
    for (const listener of this.listeners) listener();
  }
  private assertCurrent(o?: StakeOperation) {
    const c = this.deps.context();
    if (
      c.targetChainId !== 97 ||
      c.account.status === "wrong-chain" ||
      (c.account.status === "connected" && c.account.chainId !== 97)
    )
      throw new StakeTxFault("wrong-chain");
    if (c.account.status !== "connected")
      throw new StakeTxFault("disconnected");
    if (o && c.account.address.toLowerCase() !== o.account.toLowerCase())
      throw new StakeTxFault("account-changed");
    return c.account.address;
  }
  private async check(o: StakeOperation, allowanceRequired: boolean) {
    this.assertCurrent(o);
    const r = await this.deps.read(o);
    this.assertCurrent(o);
    if (o.kind === "deposit" && r.available < o.amount)
      throw new StakeTxFault("insufficient-ori");
    if (o.kind === "withdraw" && r.staked < o.amount)
      throw new StakeTxFault("insufficient-staked");
    if (allowanceRequired && r.allowance < o.amount)
      throw new StakeTxFault("insufficient-allowance");
    return r;
  }
  private fail(error: unknown) {
    const kind = stakeTxError(error);
    this.set({
      phase: kind === "user-rejected" ? "rejected" : "failed",
      error: kind,
      confirmationUnknown: kind === "confirmation-unknown",
    });
  }
  async start(kind: "deposit" | "withdraw", input: string) {
    if (this.running || stakeTxBusy(this.state)) return;
    this.running = true;
    this.state = { phase: "preparing", chainConfirmed: false };
    this.set({});
    this.receipt = undefined;
    try {
      const account = this.assertCurrent();
      // Capture the operation BEFORE simulation/signature. After a hash, this remains the receipt/query context.
      const operation: StakeOperation = Object.freeze({
        account,
        chainId: 97,
        amount: parseStakeAmount(input),
        kind,
        ...this.deps.contracts,
      });
      this.set({ operation, step: kind });
      const initial = await this.check(operation, false);
      // Human-approved exact approval: never grant maxUint256/unlimited, never proceed on an approval hash alone.
      if (kind === "deposit" && initial.allowance < operation.amount) {
        await this.execute(operation, "approve");
        this.assertCurrent(operation);
        this.set({ phase: "preparing", step: kind });
      }
      await this.check(operation, kind === "deposit");
      await this.execute(operation, kind);
    } catch (error) {
      if (this.state.phase !== "refresh-failed") this.fail(error);
    } finally {
      this.running = false;
    }
  }
  private async execute(o: StakeOperation, step: StakeStep) {
    this.set({
      phase: "preparing",
      step,
      hash: undefined,
      error: undefined,
      chainConfirmed: false,
      confirmationUnknown: false,
    });
    try {
      await this.deps.simulate(o, step);
    } catch (error) {
      throw new StakeTxFault(stakeTxError(error));
    }
    this.assertCurrent(o);
    // Re-read balances/allowance after simulation; the amount and signing context are still immutable.
    await this.check(o, step === "deposit");
    this.set({ phase: "awaiting-signature" });
    this.assertCurrent(o);
    const hash = await this.deps.send(o, step);
    this.set({ phase: "submitted", hash }); // A hash is only submission, never success.
    const receipt = await this.confirm(o, step, hash);
    await this.refreshConfirmed(o, step, receipt);
  }
  private async confirm(o: StakeOperation, step: StakeStep, hash: Hash) {
    this.set({ phase: "confirming" });
    let receipt: StakeReceipt;
    try {
      receipt = await this.deps.wait(o, step, hash, (next) =>
        this.set({ hash: next }),
      );
    } catch (error) {
      if (error instanceof StakeTxFault && error.kind === "replaced")
        throw error;
      throw new StakeTxFault("confirmation-unknown");
    }
    this.set({ hash: receipt.hash });
    if (receipt.status !== "success")
      throw new StakeTxFault("receipt-reverted");
    this.receipt = receipt;
    this.set({
      phase: "confirmed",
      chainConfirmed: true,
      confirmationUnknown: false,
      ...(step === "approve" ? { approvalHash: receipt.hash } : {}),
    });
    return receipt;
  }
  private async refreshConfirmed(
    o: StakeOperation,
    step: StakeStep,
    r: StakeReceipt,
  ) {
    this.set({ phase: "refreshing" });
    try {
      await this.deps.refresh(o, step, r.blockNumber);
      this.set({ phase: "success", error: undefined });
    } catch (error) {
      this.set({ phase: "refresh-failed", error: "refresh-failed" });
      throw error;
    }
  }
  async retryRefresh() {
    const { operation: o, step, phase } = this.state;
    if (phase !== "refresh-failed" || !o || !step || !this.receipt) return;
    // A confirmed transaction is never resent: retry only the original operation's reads.
    try {
      await this.refreshConfirmed(o, step, this.receipt);
    } catch {
      // refreshConfirmed already retained the receipt and exposed the retryable read failure.
    }
  }
  async retryConfirmation() {
    const { operation: o, step, hash } = this.state;
    if (!this.state.confirmationUnknown || !o || !step || !hash) return;
    this.set({ error: undefined, confirmationUnknown: false });
    try {
      const r = await this.confirm(o, step, hash);
      await this.refreshConfirmed(o, step, r);
    } catch (error) {
      if (this.state.phase !== "refresh-failed") this.fail(error);
    }
  }
}
