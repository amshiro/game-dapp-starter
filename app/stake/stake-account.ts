import type { WalletIdentity } from "../../src/features/wallet/model/wallet-identity";
import type { StakeAccount } from "../../src/features/stake/read/stake-read-context";

export function stakeAccount(identity: WalletIdentity): StakeAccount {
  if (identity.status === "connected")
    return {
      status: "connected",
      address: identity.address,
      chainId: identity.walletChainId ?? 0,
    };
  if (
    identity.status === "chain-mismatch" ||
    identity.status === "chain-unknown"
  )
    return { status: "wrong-chain" };
  if (
    identity.status === "loading" ||
    identity.status === "connecting" ||
    identity.status === "synchronizing"
  )
    return { status: "loading" };
  if (identity.status === "unsupported-wallet")
    return { status: "unavailable" };
  return { status: "disconnected" };
}
