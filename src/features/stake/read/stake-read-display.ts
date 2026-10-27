import { formatUnits } from "viem";
import type { StakeReadValue } from "../model/stake-display";
import type { StakeReadContext } from "./stake-read-context";
import {
  VERIFIED_ORI_DECIMALS,
  VERIFIED_STAKE_CHAIN,
} from "./stake-read-queries";

type QuerySnapshot = Readonly<{
  data?: bigint;
  isPending: boolean;
  isError: boolean;
}>;
export function principalDisplay(
  query: QuerySnapshot,
  context: StakeReadContext,
  personal: boolean,
): StakeReadValue {
  if (
    context.targetChainId !== VERIFIED_STAKE_CHAIN ||
    context.account.status === "unavailable"
  )
    return { status: "unavailable" };
  if (
    context.account.status === "wrong-chain" ||
    (context.account.status === "connected" &&
      context.account.chainId !== context.targetChainId)
  )
    return { status: "wrongChain" };
  if (personal && context.account.status !== "connected")
    return {
      status: context.account.status === "loading" ? "loading" : "disconnected",
    };
  if (query.isError) return { status: "error" };
  if (query.isPending || query.data === undefined) return { status: "loading" };
  const exact = formatUnits(query.data, VERIFIED_ORI_DECIMALS);
  const [whole, fraction] = exact.split(".");
  // Truncate display only. Keep the original bigint and full decimal string for exact inspection.
  const shortFraction = fraction?.slice(0, 6).replace(/0+$/, "");
  return {
    status: "populated",
    text: shortFraction
      ? `${whole}.${shortFraction}`
      : whole === "0" && query.data > BigInt(0)
        ? "<0.000001"
        : whole,
    exact,
    raw: query.data,
  };
}
