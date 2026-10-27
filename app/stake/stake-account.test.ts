import { describe, expect, it } from "vitest";
import { stakeAccount } from "./stake-account";
import type { WalletIdentity } from "../../src/features/wallet/model/wallet-identity";

const address = "0x0000000000000000000000000000000000000001" as const;
describe("Stake route SDK projection", () => {
  it("passes only a settled connected identity to account reads", () => {
    expect(
      stakeAccount({ status: "connected", address, walletChainId: 97 }),
    ).toEqual({ status: "connected", address, chainId: 97 });
    for (const status of ["loading", "connecting", "synchronizing"] as const)
      expect(stakeAccount({ status })).toEqual({ status: "loading" });
    for (const status of ["unauthenticated", "wallet-missing"] as const)
      expect(stakeAccount({ status })).toEqual({ status: "disconnected" });
  });
  it("does not carry a stale address across chain/unsupported-wallet boundaries", () => {
    for (const status of ["chain-mismatch", "chain-unknown"] as const)
      expect(stakeAccount({ status, address, walletChainId: 56 })).toEqual({
        status: "wrong-chain",
      });
    expect(
      stakeAccount({ status: "unsupported-wallet" } satisfies WalletIdentity),
    ).toEqual({ status: "unavailable" });
    expect(stakeAccount({ status: "connected", address })).toMatchObject({
      chainId: 0,
    });
  });
});
