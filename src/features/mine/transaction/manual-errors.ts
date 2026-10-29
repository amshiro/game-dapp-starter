export type ManualError =
  | "user-rejected"
  | "disconnected"
  | "wrong-chain"
  | "account-changed"
  | "no-selection"
  | "invalid-amount"
  | "insufficient-native"
  | "invalid-mask"
  | "duplicate-cell"
  | "already-deployed-round"
  | "different-amount"
  | "round-unavailable"
  | "checkpoint-required"
  | "simulation-reverted"
  | "rpc-error"
  | "receipt-reverted"
  | "confirmation-unknown"
  | "verification-failed"
  | "refresh-failed"
  | "replaced";
export class ManualFault extends Error {
  constructor(public readonly kind: ManualError) {
    super(kind);
  }
}
export function manualError(error: unknown): ManualError {
  if (error instanceof ManualFault) return error.kind;
  if (
    error instanceof Error &&
    [
      "no-selection",
      "invalid-amount",
      "invalid-mask",
      "already-deployed-round",
    ].includes(error.message)
  )
    return error.message as ManualError;
  const seen = new Set<unknown>();
  let e: unknown = error;
  while (e && typeof e === "object" && !seen.has(e)) {
    seen.add(e);
    const x = e as {
      code?: number;
      name?: string;
      cause?: unknown;
      data?: { errorName?: string };
    };
    if (x.code === 4001 || /UserRejected/.test(x.name ?? ""))
      return "user-rejected";
    if (/ChainMismatch|ChainNotConfigured/.test(x.name ?? ""))
      return "wrong-chain";
    if (/AccountNotFound/.test(x.name ?? "")) return "account-changed";
    if (/InsufficientFunds/.test(x.name ?? "")) return "insufficient-native";
    const specific: Record<string, ManualError> = {
      InvalidMask: "invalid-mask",
      InvalidAmount: "invalid-amount",
      AlreadyDeployedThisRound: "duplicate-cell",
      DifferentAmountPerSquareNotSupported: "different-amount",
      MustCheckpointPreviousRound: "checkpoint-required",
      RoundNotLive: "round-unavailable",
      PleaseWaitForVRF: "round-unavailable",
      RandomnessPending: "round-unavailable",
      AutomationConflictWithManualBet: "round-unavailable",
    };
    if (x.data?.errorName && specific[x.data.errorName])
      return specific[x.data.errorName];
    if (/ContractFunctionReverted|ExecutionReverted/.test(x.name ?? ""))
      return "simulation-reverted";
    e = x.cause;
  }
  return "rpc-error";
}
