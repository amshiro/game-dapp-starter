export type StakeTxError =
  | "invalid-amount"
  | "zero-amount"
  | "insufficient-ori"
  | "insufficient-staked"
  | "disconnected"
  | "wrong-chain"
  | "account-changed"
  | "insufficient-gas"
  | "insufficient-allowance"
  | "simulation-reverted"
  | "rpc-error"
  | "user-rejected"
  | "receipt-reverted"
  | "confirmation-unknown"
  | "replaced"
  | "refresh-failed";
export class StakeTxFault extends Error {
  constructor(public readonly kind: StakeTxError) {
    super(kind);
  }
}
export function stakeTxError(error: unknown): StakeTxError {
  if (error instanceof StakeTxFault) return error.kind;
  if (
    error instanceof Error &&
    ["invalid-amount", "zero-amount"].includes(error.message)
  )
    return error.message as StakeTxError;
  const seen = new Set<unknown>();
  let current: unknown = error;
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    const e = current as {
      code?: number;
      name?: string;
      data?: { errorName?: string };
      cause?: unknown;
    };
    if (e.code === 4001 || /UserRejected/.test(e.name ?? ""))
      return "user-rejected";
    if (/ChainMismatch|ChainNotConfigured/.test(e.name ?? ""))
      return "wrong-chain";
    if (/AccountNotFound|ConnectorAccountNotFound/.test(e.name ?? ""))
      return "account-changed";
    if (/InsufficientFunds/.test(e.name ?? "")) return "insufficient-gas";
    if (e.data?.errorName === "ERC20InsufficientAllowance")
      return "insufficient-allowance";
    if (e.data?.errorName === "ERC20InsufficientBalance")
      return "insufficient-ori";
    if (/ContractFunctionReverted|ExecutionReverted/.test(e.name ?? ""))
      return "simulation-reverted";
    current = e.cause;
  }
  return "rpc-error";
}
