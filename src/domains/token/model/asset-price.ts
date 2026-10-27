import { isAddressEqual, type Address } from "viem";

/** One priced asset from the backend asset config. */
export type AssetPrice = Readonly<{
  /** Backend asset symbol, e.g. `bnb`; not unique across inner / outer rows. */
  symbol: string;
  /** EIP-55 checksum form whatever casing the backend used; absent when empty. */
  address: Address | undefined;
  /** Decimal string exactly as received; unit and precision policy are open. */
  price: string;
  /** Inner (bonding) vs outer market; only some rows distinguish it. */
  isInner: boolean | undefined;
}>;

/**
 * Address match by EVM identity, never by string casing: registry addresses are
 * checksummed while backend keys may use any casing.
 */
export function findAssetPrice(
  prices: readonly AssetPrice[],
  address: Address,
  isInner?: boolean,
): AssetPrice | undefined {
  return prices.find(
    (item) =>
      item.address !== undefined &&
      isAddressEqual(item.address, address) &&
      (isInner === undefined || item.isInner === isInner),
  );
}
