import { formatDecimal } from "../../../shared/lib/number/format-decimal";
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
  return {
    status: "populated",
    text: formatDecimal(exact, {
      decimals: 6,
      smallThreshold: true,
      group: true,
    }),
    exact,
    raw: query.data,
  };
}
