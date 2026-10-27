import { getAddress, isAddress, isAddressEqual, type Address } from "viem";

type WalletFact = Readonly<{
  address: string;
  chainId: string;
  walletClientType: string;
}>;

export type WalletIdentityFacts = Readonly<{
  privyReady: boolean;
  walletsReady: boolean;
  authenticated: boolean;
  modalOpen: boolean;
  connectionStatus:
    "connected" | "connecting" | "reconnecting" | "disconnected";
  address?: string;
  chainId?: number;
  wallets: readonly WalletFact[];
  targetChainId: number;
}>;

export type WalletIdentity =
  | Readonly<{
      status:
        | "loading"
        | "connecting"
        | "unauthenticated"
        | "wallet-missing"
        | "synchronizing"
        | "unsupported-wallet";
    }>
  | Readonly<{
      status: "connected" | "chain-mismatch" | "chain-unknown";
      address: Address;
      walletChainId?: number;
    }>;

/** Pure render-time projection, never a second wallet store or readiness flag. */
export function deriveWalletIdentity(
  facts: WalletIdentityFacts,
): WalletIdentity {
  if (!facts.privyReady) return { status: "loading" };
  if (facts.modalOpen) return { status: "connecting" };
  if (!facts.authenticated) return { status: "unauthenticated" };
  if (!facts.walletsReady) return { status: "loading" };
  if (
    facts.connectionStatus === "connecting" ||
    facts.connectionStatus === "reconnecting"
  ) {
    return { status: "synchronizing" };
  }
  if (
    facts.connectionStatus !== "connected" ||
    !facts.address ||
    !isAddress(facts.address, { strict: false })
  ) {
    return { status: "wallet-missing" };
  }
  const address = getAddress(facts.address);
  const wallet = facts.wallets.find(
    (candidate) =>
      isAddress(candidate.address, { strict: false }) &&
      isAddressEqual(candidate.address as Address, address),
  );
  // Never substitute wallets[0] or an authenticated user's linked-but-disconnected wallet.
  if (!wallet) return { status: "synchronizing" };
  if (wallet.walletClientType === "privy")
    return { status: "unsupported-wallet" };
  const match = /^eip155:([1-9]\d*)$/.exec(wallet.chainId);
  const walletChainId = match ? Number(match[1]) : undefined;
  if (walletChainId === undefined || !Number.isSafeInteger(walletChainId)) {
    return { status: "chain-unknown", address };
  }
  if (walletChainId !== facts.targetChainId) {
    return { status: "chain-mismatch", address, walletChainId };
  }
  // A bridge update may lag a wallet chain change; don't claim the target is ready.
  if (facts.chainId !== walletChainId)
    return { status: "chain-unknown", address, walletChainId };
  return { status: "connected", address, walletChainId };
}

export function shortenWalletAddress(address: Address): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
