import { formatUnits } from "viem";
export type MineRewardAmounts = Readonly<{
  ethAmount: bigint;
  oriDirect: bigint;
  oriRefined: bigint;
}>;
export type MineRewardItem = Readonly<{
  field: keyof MineRewardAmounts;
  label: "rewardAsset" | "unrefined" | "refined";
  asset: "BNB" | "ORI";
  raw: bigint;
  exact: string;
}>;
export type MineRewardsDisplay =
  | Readonly<{
      status:
        | "empty"
        | "disconnected"
        | "unavailable"
        | "wrong-chain"
        | "loading"
        | "error";
    }>
  | Readonly<{
      status: "populated";
      amounts: MineRewardAmounts;
      rows: readonly MineRewardItem[];
      showClaimAll: boolean;
      showClaimEth: boolean;
    }>;
export function presentMineRewards(
  amounts: MineRewardAmounts,
): MineRewardsDisplay {
  const fields = [
    ["ethAmount", "rewardAsset", "BNB"],
    ["oriDirect", "unrefined", "ORI"],
    ["oriRefined", "refined", "ORI"],
  ] as const;
  const rows: MineRewardItem[] = [];
  for (const [field, label, asset] of fields) {
    const raw = amounts[field];
    if (typeof raw !== "bigint" || raw < BigInt(0))
      throw Error("Invalid Mine reward amount");
    if (raw === BigInt(0)) continue;
    // Development97: native BNB uses wei; ORI metadata is 18 decimals. No tax/expiry/claimable amount is inferred.
    rows.push({ field, label, asset, raw, exact: formatUnits(raw, 18) });
  }
  // Visibility and action kinds are human-confirmed; never use rounded display text to decide whether rewards exist.
  if (!rows.length) return { status: "empty" };
  return {
    status: "populated",
    amounts,
    rows,
    showClaimAll:
      amounts.oriDirect > BigInt(0) || amounts.oriRefined > BigInt(0),
    showClaimEth: amounts.ethAmount > BigInt(0),
  };
}
