import type { Address } from "viem";

/** Clipboard is an optional browser capability; never expose platform error details. */
export async function copyWalletAddress(
  address: Address,
  writeText: (text: string) => Promise<void>,
): Promise<"copied" | "copyFailed"> {
  try {
    await writeText(address);
    return "copied";
  } catch {
    return "copyFailed";
  }
}
