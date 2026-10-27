import { describe, expect, it, vi } from "vitest";
import { copyWalletAddress } from "./copy-wallet-address";

const address = "0x1111111111111111111111111111111111111111";
describe("copy wallet address", () => {
  it("copies the complete current address, not its display abbreviation", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    expect(await copyWalletAddress(address, write)).toBe("copied");
    expect(write).toHaveBeenCalledExactlyOnceWith(address);
  });
  it("turns denied access into safe feedback and allows another attempt", async () => {
    const write = vi
      .fn()
      .mockRejectedValueOnce(new Error("private platform data"))
      .mockResolvedValueOnce(undefined);
    expect(await copyWalletAddress(address, write)).toBe("copyFailed");
    expect(await copyWalletAddress(address, write)).toBe("copied");
  });
  it("handles an absent browser clipboard without an unhandled rejection", async () => {
    expect(
      await copyWalletAddress(address, () => {
        throw new TypeError("clipboard unavailable");
      }),
    ).toBe("copyFailed");
  });
});
