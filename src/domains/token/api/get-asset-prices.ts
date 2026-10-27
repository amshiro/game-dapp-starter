import { requestOriBackend } from "../../../shared/api/ori-backend";
import type { AssetPrice } from "../model/asset-price";
import { mapAssetPrices } from "./asset-price-dto";

const PATH = "/query/chain_asset_config";

/** Prices of every configured asset; the request takes no address or chain. */
export async function getAssetPrices(
  options: Readonly<{ signal?: AbortSignal }> = {},
): Promise<readonly AssetPrice[]> {
  const data = await requestOriBackend({ path: PATH, signal: options.signal });
  return mapAssetPrices(data, `/v1/ori${PATH}`);
}
