import type { Address } from "viem";

// Route composition projects SDK facts into props; this is not a wallet state owner.
export type StakeAccount =
  | Readonly<{ status: "connected"; address: Address; chainId: number }>
  | Readonly<{
      status: "disconnected" | "loading" | "wrong-chain" | "unavailable";
    }>;
export type StakeReadContext = Readonly<{
  targetChainId: number;
  account: StakeAccount;
}>;
