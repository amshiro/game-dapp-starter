import { describe, expect, test } from "vitest";
import { InvalidResponseError } from "../../../shared/api/errors";
import { getAssetAddress } from "../../../shared/config/evm-contracts";
import { findAssetPrice } from "../model/asset-price";
import { mapAssetPrices } from "./asset-price-dto";

const endpoint = "/v1/ori/query/chain_asset_config";
// The registry stores the canonical checksum; the legacy source used `0xBB4C…`.
const WBNB = getAssetAddress(56, "wbnb");
const ORIGIN = getAssetAddress(56, "originToken");

// Shape of the documented `chain_asset_config` row (api-reference/user-api.md).
const documentedRow = {
  id: 1,
  chain: "bsc",
  asset_type: "erc20",
  contract_addr: WBNB,
  aux_contract_addr: WBNB,
  symbol: "bnb",
  client_symbol: "BNB",
  system_decimal: 8,
  token_decimal: 18,
  price: 843.35,
  icon: "",
  wd_enable: 0,
  contract_enable: 0,
  wd_fee_symbol: "",
  wd_fee_usdt: 0,
  wd_min_usdt_value: 0,
  wd_interval: 0,
  created_at: "2025-11-24T15:14:39.000000Z",
  updated_at: "2025-11-24T10:55:03.000000Z",
};

const row = (overrides: Record<string, unknown>) => ({
  ...documentedRow,
  ...overrides,
});

describe("asset price DTO → model", () => {
  test("maps the documented row and ignores fields the model does not use", () => {
    expect(mapAssetPrices([documentedRow], endpoint)).toEqual([
      { symbol: "bnb", address: WBNB, price: "843.35", isInner: undefined },
    ]);
  });

  test("keeps decimal string prices exactly as received", () => {
    const [item] = mapAssetPrices(
      [row({ price: "612.123456789012345678" })],
      endpoint,
    );
    expect(item.price).toBe("612.123456789012345678");
  });

  test("plain JSON numbers are accepted, exponent notation is not", () => {
    expect(mapAssetPrices([row({ price: 0.5 })], endpoint)[0].price).toBe(
      "0.5",
    );
    expect(() => mapAssetPrices([row({ price: 1e-7 })], endpoint)).toThrow(
      InvalidResponseError,
    );
  });

  test("an empty aux_contract_addr (documented) maps to no address", () => {
    const [item] = mapAssetPrices(
      [row({ symbol: "qiyuan", aux_contract_addr: "" })],
      endpoint,
    );
    expect(item.address).toBeUndefined();
    expect(findAssetPrice([item], WBNB)).toBeUndefined();
  });

  test("maps the runtime-only is_inner 0 / 1 to an explicit market flag", () => {
    const prices = mapAssetPrices(
      [
        row({ aux_contract_addr: ORIGIN, is_inner: 1 }),
        row({ aux_contract_addr: ORIGIN, is_inner: 0 }),
      ],
      endpoint,
    );
    expect(prices.map((p) => p.isInner)).toEqual([true, false]);
  });

  test.each([
    [{ not: "an array" }],
    [[row({ aux_contract_addr: "0x1234" })]],
    [[row({ aux_contract_addr: null })]],
    [[row({ price: "-1" })]],
    [[row({ price: "1,234" })]],
    [[row({ price: null })]],
    [[row({ is_inner: 2 })]],
    [[row({ symbol: undefined })]],
  ])("rejects contract violation %j", (data) => {
    expect(() => mapAssetPrices(data, endpoint)).toThrow(InvalidResponseError);
  });
});

describe("address-case policy for price lookup", () => {
  // Same WBNB address in the casings that can reach the client.
  test.each([
    ["checksum", "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"],
    ["lowercase", "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c"],
    ["legacy casing", "0xBB4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"],
  ])("backend key in %s form matches the registry address", (_label, key) => {
    const prices = mapAssetPrices(
      [row({ aux_contract_addr: key, price: "600" })],
      endpoint,
    );
    expect(prices[0].address).toBe(WBNB);
    expect(findAssetPrice(prices, WBNB)?.price).toBe("600");
  });

  test("inner / outer filter selects the right origin price", () => {
    const prices = mapAssetPrices(
      [
        row({
          aux_contract_addr: ORIGIN.toLowerCase(),
          price: "1",
          is_inner: 1,
        }),
        row({
          aux_contract_addr: ORIGIN.toLowerCase(),
          price: "2",
          is_inner: 0,
        }),
      ],
      endpoint,
    );
    expect(findAssetPrice(prices, ORIGIN, true)?.price).toBe("1");
    expect(findAssetPrice(prices, ORIGIN, false)?.price).toBe("2");
    expect(findAssetPrice(prices, WBNB)).toBeUndefined();
  });
});
