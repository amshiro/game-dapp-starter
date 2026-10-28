import { describe, expect, it } from "vitest";
import { getEvmChainForEnvironment } from "../../../shared/config/evm-chains";
import type { WalletIdentity } from "../model/wallet-identity";
import { nativeBalanceAccount, nativeBalanceDisplay } from "./native-balance";

const chain = getEvmChainForEnvironment("development");
const identity: WalletIdentity = {
  status: "connected",
  address: "0x1111111111111111111111111111111111111111",
  walletChainId: 97,
};
const settled = {
  isPending: false,
  isError: false,
  data: { value: BigInt("1234567890123456789"), decimals: 18 },
};

describe("Wallet native BNB display", () => {
  it("retains exact bigint/decimal values while truncating only presentation", () => {
    expect(nativeBalanceDisplay(settled, identity, chain)).toEqual({
      status: "populated",
      text: "1.234567",
      exact: "1.234567890123456789",
      raw: BigInt("1234567890123456789"),
    });
  });
  it.each([
    [BigInt("0"), "0", "0"],
    [BigInt("1"), "<0.000001", "0.000000000000000001"],
    [
      BigInt("90071992547409931234567890123456789"),
      "90071992547409931.234567",
      "90071992547409931.234567890123456789",
    ],
  ] as const)(
    "formats %s without floating-point conversion",
    (raw, text, exact) => {
      expect(
        nativeBalanceDisplay(
          { ...settled, data: { value: raw, decimals: 18 } },
          identity,
          chain,
        ),
      ).toMatchObject({ status: "populated", text, exact });
    },
  );
  it("suppresses cached data for disconnected, wrong-chain and unresolved identities", () => {
    const identities: WalletIdentity[] = [
      { status: "unauthenticated" },
      { status: "synchronizing" },
      { ...identity, status: "chain-mismatch", walletChainId: 56 },
      { ...identity, status: "chain-unknown" },
      { ...identity, walletChainId: 56 },
    ];
    for (const current of identities) {
      expect(nativeBalanceAccount(current, chain)).toBeUndefined();
      expect(nativeBalanceDisplay(settled, current, chain)).toEqual({
        status: "unavailable",
      });
    }
  });
  it("uses the new account as query input and refuses the old target chain", () => {
    const next = {
      ...identity,
      address: "0x2222222222222222222222222222222222222222" as const,
    };
    expect(nativeBalanceAccount(next, chain)).toBe(next.address);
    expect(
      nativeBalanceAccount(next, getEvmChainForEnvironment("production")),
    ).toBeUndefined();
  });
  it("distinguishes loading, error and incompatible decimals from a real zero balance", () => {
    expect(
      nativeBalanceDisplay(
        { isPending: true, isError: false },
        identity,
        chain,
      ),
    ).toEqual({ status: "loading" });
    expect(
      nativeBalanceDisplay({ ...settled, isError: true }, identity, chain),
    ).toEqual({ status: "error" });
    expect(
      nativeBalanceDisplay(
        { ...settled, data: { value: BigInt("1"), decimals: 8 } },
        identity,
        chain,
      ),
    ).toEqual({ status: "error" });
  });
});
