import { requestOriBackend } from "../../../shared/api/ori-backend";
import { InvalidResponseError } from "../../../shared/api/errors";
import type { ExploreSectionId } from "../model/explore-display";
import { exploreDecimal, exploreObject } from "./explore-statistics";

export const EXPLORE_PAGE_SIZE = 10;
export function exploreCount(value: unknown): number {
  const exact = exploreDecimal(value);
  if (!/^\d+$/.test(exact) || BigInt(exact) > BigInt(Number.MAX_SAFE_INTEGER))
    throw new InvalidResponseError("Invalid Explore count", "/v1/ori");
  return Number(exact);
}
export function mapExploreRecords(value: unknown) {
  const data = exploreObject(value);
  if (!Array.isArray(data.list) || data.list.length > EXPLORE_PAGE_SIZE)
    throw new InvalidResponseError("Invalid Explore list", "/v1/ori");
  const total = exploreCount(data.total);
  const rows = data.list.map(exploreObject);
  if (rows.length > total)
    throw new InvalidResponseError("Invalid Explore total", "/v1/ori");
  return { rows, total };
}
export function exploreRecordRequest(section: ExploreSectionId, page: number) {
  if (!Number.isSafeInteger(page) || page < 1)
    throw Error("Invalid Explore page");
  const paging = { page: String(page), page_size: String(EXPLORE_PAGE_SIZE) };
  return section === "buybacks"
    ? { path: "/bury_event/list", form: paging }
    : {
        path: "/reset_event/list",
        form: { ...paging, motherlode: section === "motherlodes" ? "1" : "" },
      };
}
export async function getExploreRecords(
  section: ExploreSectionId,
  page: number,
  signal: AbortSignal,
) {
  return mapExploreRecords(
    await requestOriBackend({ ...exploreRecordRequest(section, page), signal }),
  );
}
