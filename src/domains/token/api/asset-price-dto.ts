import { getAddress, isAddress } from "viem";
import { InvalidResponseError } from "../../../shared/api/errors";
import type { AssetPrice } from "../model/asset-price";

/**
 * `chain_asset_config` item (api-reference/user-api.md), limited to the fields
 * the model needs. `is_inner` is not in the documented contract but is
 * returned by the Development backend and used by ori-website, so it stays
 * optional.
 */
type AssetPriceDto = Readonly<{
  symbol: string;
  /** Documented as possibly `""`; any casing is observed at runtime. */
  aux_contract_addr: string;
  /** Documented as a number; plain decimal strings are observed at runtime. */
  price: string | number;
  is_inner?: 0 | 1;
}>;

const DECIMAL = /^\d+(\.\d+)?$/;

/** Pure DTO → model mapping; rejects anything outside the known contract. */
export function mapAssetPrices(
  data: unknown,
  endpoint: string,
): readonly AssetPrice[] {
  if (!Array.isArray(data)) invalid(endpoint, "data is not an array");
  return data.map((item: unknown, index) => {
    if (!isDto(item)) invalid(endpoint, `item ${index} does not match`);
    return Object.freeze({
      symbol: item.symbol,
      address:
        item.aux_contract_addr === ""
          ? undefined
          : getAddress(item.aux_contract_addr),
      price: toDecimalString(item.price, endpoint, index),
      isInner: item.is_inner === undefined ? undefined : item.is_inner === 1,
    });
  });
}

function isDto(item: unknown): item is AssetPriceDto {
  if (item === null || typeof item !== "object") return false;
  const { symbol, aux_contract_addr, price, is_inner } = item as Record<
    string,
    unknown
  >;
  return (
    typeof symbol === "string" &&
    typeof aux_contract_addr === "string" &&
    (aux_contract_addr === "" ||
      // Any casing: backend keys are not guaranteed to be EIP-55.
      isAddress(aux_contract_addr, { strict: false })) &&
    (typeof price === "string" || typeof price === "number") &&
    (is_inner === undefined || is_inner === 0 || is_inner === 1)
  );
}

/**
 * Keeps the backend's decimal text. A JSON number is already a double; it is
 * accepted only when its text is a plain decimal, never exponent notation.
 */
function toDecimalString(
  price: string | number,
  endpoint: string,
  index: number,
): string {
  const text = typeof price === "number" ? String(price) : price;
  if (!DECIMAL.test(text)) invalid(endpoint, `item ${index} price`);
  return text;
}

function invalid(endpoint: string, detail: string): never {
  throw new InvalidResponseError(
    `Response from ${endpoint} is invalid: ${detail}`,
    endpoint,
  );
}
