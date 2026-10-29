import { describe, expect, it, vi } from "vitest";
import {
  getPointsRecords,
  getPointsTotal,
  pointsRecord,
  pointsTotal,
} from "./points-api";
import { requestOriBackend } from "../../../shared/api/ori-backend";
vi.mock("../../../shared/api/ori-backend", () => ({
  requestOriBackend: vi.fn(),
}));
const account = "0x0000000000000000000000000000000000000001" as const;
const record = {
  id: 1,
  miner: account,
  bet_amount: "1.000000000000000000",
  points_reward: "1234.999",
  timestamp: 1763749202,
};
describe("Points API mapping", () => {
  it("keeps a one-wei stake visible and truncates only earned points", () => {
    const row = pointsRecord(record, account, "en");
    expect(row.stake).toBe("0.000000000000000001 BNB");
    expect(row.earned).toBe("1,234.99");
    expect(row.value).toBe("—");
  });
  it("groups exact totals and handles explicit empty accounts", () => {
    expect(
      pointsTotal(
        { miner: account, total_points: "9007199254740993.1234" },
        account,
      ),
    ).toBe("9,007,199,254,740,993.1234");
    for (const empty of [null, [], {}])
      expect(pointsTotal(empty, account)).toBe("0");
  });
  it("rejects invalid units, unsafe numbers, and another account", () => {
    expect(() =>
      pointsRecord({ ...record, bet_amount: "1.1" }, account, "en"),
    ).toThrow();
    expect(() =>
      pointsTotal({ total_points: 9007199254740992 }, account),
    ).toThrow();
    expect(() =>
      pointsRecord(
        { ...record, miner: "0x0000000000000000000000000000000000000002" },
        account,
        "en",
      ),
    ).toThrow();
  });
  it("uses the confirmed user endpoint and preserves failures", async () => {
    vi.mocked(requestOriBackend).mockResolvedValueOnce({
      miner: account,
      total_points: 0,
    });
    const signal = new AbortController().signal;
    expect(await getPointsTotal(account, signal)).toBe("0");
    expect(requestOriBackend).toHaveBeenLastCalledWith({
      path: "/points/user",
      form: { miner: account },
      signal,
    });
    vi.mocked(requestOriBackend).mockRejectedValueOnce(
      Error("backend unavailable"),
    );
    await expect(getPointsTotal(account, signal)).rejects.toThrow(
      "backend unavailable",
    );
  });
  it("requests only the selected page with 20 rows per page", async () => {
    vi.mocked(requestOriBackend).mockResolvedValueOnce({
      total: 21,
      list: [{ ...record, id: 21 }],
    });
    const signal = new AbortController().signal;
    const result = await getPointsRecords(account, "en", signal, 2);
    expect(result.records.map((row) => row.id)).toEqual(["21"]);
    expect(result.total).toBe(21);
    expect(requestOriBackend).toHaveBeenLastCalledWith({
      path: "/points/list",
      form: { miner: account, page: "2", page_size: "20" },
      signal,
    });
    vi.mocked(requestOriBackend).mockResolvedValueOnce({
      total: 0,
      list: [],
      user_points: null,
    });
    expect(await getPointsRecords(account, "en", signal)).toEqual({
      records: [],
      totalPoints: "0",
      total: 0,
    });
  });
});
