import { describe, expect, it } from "vitest";
import { exploreRecordRequest, mapExploreRecords } from "./explore-records";

describe("Explore records contract", () => {
  it("requests the selected page with string parameters and distinct filters", () => {
    expect(exploreRecordRequest("mining", 3)).toEqual({
      path: "/reset_event/list",
      form: { page: "3", page_size: "10", motherlode: "" },
    });
    expect(exploreRecordRequest("motherlodes", 2).form).toEqual({
      page: "2",
      page_size: "10",
      motherlode: "1",
    });
    expect(exploreRecordRequest("buybacks", 4)).toEqual({
      path: "/bury_event/list",
      form: { page: "4", page_size: "10" },
    });
  });
  it("accepts explicit empty results and rejects malformed payloads", () => {
    expect(mapExploreRecords({ list: [], total: 0 })).toEqual({
      rows: [],
      total: 0,
    });
    expect(() => mapExploreRecords({ list: null, total: 0 })).toThrow();
    expect(() =>
      mapExploreRecords({ list: [], total: 9007199254740992 }),
    ).toThrow();
    expect(() => exploreRecordRequest("mining", 0)).toThrow();
  });
});
