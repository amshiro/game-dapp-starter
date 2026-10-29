import { formatDecimal } from "../../../shared/lib/number/format-decimal";
import { formatUnits, type Address } from "viem";
import type { EvmChain } from "../../../shared/config/evm-chains";
import type { WalletIdentity } from "../model/wallet-identity";

export type WalletBalance =
  | Readonly<{ status: "unavailable" | "loading" | "error" }>
  | Readonly<{ status: "populated"; text: string; exact: string; raw: bigint }>;

type BalanceQuery = Readonly<{
  data?: Readonly<{ value: bigint; decimals: number }>;
  isPending: boolean;
  isError: boolean;
}>;

export function nativeBalanceAccount(
  identity: WalletIdentity,
  targetChain: EvmChain,
): Address | undefined {
  return identity.status === "connected" &&
    identity.walletChainId === targetChain.id
    ? identity.address
    : undefined;
}

export function nativeBalanceDisplay(
  query: BalanceQuery,
  identity: WalletIdentity,
  targetChain: EvmChain,
): WalletBalance {
  // Never reveal cached balance from an old account or another wallet chain.
  if (!nativeBalanceAccount(identity, targetChain))
    return { status: "unavailable" };
  if (query.isError) return { status: "error" };
  if (query.isPending || !query.data) return { status: "loading" };
  if (query.data.decimals !== targetChain.nativeCurrency.decimals)
    return { status: "error" };
  const raw = query.data.value;
  const exact = formatUnits(raw, targetChain.nativeCurrency.decimals);
  return {
    status: "populated",
    text: formatDecimal(exact, { decimals: 6, smallThreshold: true }),
    exact,
    raw,
  };
}
