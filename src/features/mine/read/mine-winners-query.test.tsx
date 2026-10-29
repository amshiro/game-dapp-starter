import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import {
  mineWinnersDisplay,
  winnerAmount,
  winnerInteger,
} from "../api/mine-winners";
import { createMineWinnersQuery } from "./mine-winners-query";
import type { ManualContext } from "../transaction/manual-transaction";
import type { MineBoardSnapshot } from "./mine-read-query";
import { MineResults } from "../components/mine-results";
import { LocaleProvider } from "../../../shared/i18n/locale-provider";
import { parsePublicConfig } from "../../../shared/config/parse-public-config";
const a = "0x0000000000000000000000000000000000000001",
  b = "0x0000000000000000000000000000000000000002";
const round = BigInt("9007199254740993"),
  context: ManualContext = {
    targetChainId: 97,
    ready: true,
    wrongChain: false,
    address: a,
  };
const snapshot: MineBoardSnapshot = {
  blockNumber: BigInt(100),
  roundId: round,
  initialized: true,
  randomnessFulfilled: true,
  winningSquare: 3,
  totalDeployed: BigInt(1),
  deployedPerSquare: [],
  minersPerSquare: [],
  transition: true,
};
const readConfig = () =>
  parsePublicConfig({
    NEXT_PUBLIC_APP_ENV: "development",
    NEXT_PUBLIC_API_BASE_URL: "https://example.test",
  });
const row = (address = a, eth = "236350000", ori = "100000000000") => ({
  round_id: round.toString(),
  winner_address: address,
  eth_reward: eth,
  ore_reward: ori,
});
const options = (
  request = vi.fn(async () => ({ round_id: round.toString(), list: [row()] })),
) => createMineWinnersQuery(context, snapshot, request, readConfig);
describe("human-approved current-result winners", () => {
  it("uses 8-decimal API units, truncates to 6 decimals without unsafe money conversion", () => {
    expect(winnerAmount(BigInt("123456789"))).toEqual({
      raw: BigInt("123456789"),
      exact: "1.23456789",
      text: "1.234567",
    });
    expect(winnerAmount(BigInt(1)).text).toBe("0");
    expect(winnerAmount(BigInt(100000000)).text).toBe("1");
    expect(winnerAmount(BigInt("900719925474099312345678")).text).toBe(
      "9007199254740993.123456",
    );
  });
  it.each([
    Number.MAX_SAFE_INTEGER + 1,
    -1,
    0.5,
    "1e8",
    "1.2",
    null,
    undefined,
    "-1",
  ])("rejects invalid/unsafe raw %s", (raw) =>
    expect(() => winnerInteger(raw)).toThrow(),
  );
  it("accepts lossless strings and safe integers only", () => {
    expect(winnerInteger("9007199254740993")).toBe(round);
    expect(winnerInteger(100)).toBe(BigInt(100));
  });
  it("keeps backend order and duplicate rows; only first matching row is You", () => {
    const display = mineWinnersDisplay(
      { list: [row(a), row(b), row(a)] },
      round,
      a,
    );
    expect(display.status).toBe("populated");
    if (display.status !== "populated") throw Error("fixture");
    expect(display.rows.map((r) => r.address)).toEqual([a, b, a]);
    expect(display.rows.map((r) => r.isCurrentUser)).toEqual([
      true,
      false,
      false,
    ]);
    expect(new Set(display.rows.map((r) => r.id)).size).toBe(3);
    const notFirst = mineWinnersDisplay({ list: [row(b), row(a)] }, round, a);
    if (notFirst.status === "populated")
      expect(notFirst.rows.every((r) => !r.isCurrentUser)).toBe(true);
  });
  it("always includes BNB, includes ORI only when raw>0, keeps raw/exact even if display truncates to zero", () => {
    const d = mineWinnersDisplay(
      { list: [row(a, "0", "1"), row(b, "0", "0")] },
      round,
    );
    if (d.status !== "populated") throw Error("fixture");
    expect(d.rows[0].amounts.map((x) => x.unit)).toEqual(["ORI", "BNB"]);
    expect(d.rows[0].amounts[0]).toMatchObject({
      raw: BigInt(1),
      exact: "0.00000001",
      text: "0",
    });
    expect(d.rows[1].amounts).toEqual([
      { unit: "BNB", raw: BigInt(0), exact: "0", text: "0" },
    ]);
  });
  it("empty results hide title and whole module", () => {
    const d = mineWinnersDisplay({ list: [] }, round, a);
    expect(d.status).toBe("empty");
    expect(renderToStaticMarkup(<MineResults display={d} />)).toBe("");
  });
  it.each([
    { list: [{ ...row(), winner_address: "bad" }] },
    { list: [{ ...row(), eth_reward: "1.1" }] },
    { list: [{ ...row(), ore_reward: undefined }] },
    { list: [{ ...row(), round_id: "4" }] },
    { list: [], round_id: "4" },
    { round_id: round.toString(), start_block: 1 },
  ])(
    "rejects malformed/mismatched response without filtering rows or switching endpoint",
    (data) => expect(() => mineWinnersDisplay(data, round, a)).toThrow(),
  );
  it("renders approved first-row You, separator, icons, unit semantics and Chinese title", () => {
    const d = mineWinnersDisplay({ list: [row(a), row(b)] }, round, a),
      html = renderToStaticMarkup(
        <LocaleProvider locale="zh-CN">
          <MineResults display={d} />
        </LocaleProvider>,
      );
    expect(html).toContain("矿工");
    expect(html).toContain(`回合: #${round}`);
    expect(html).toContain(">你<");
    expect(html.match(/data-current-user="true"/g)).toHaveLength(1);
    expect(html).toContain("reward-bnb.svg");
    expect(html).toContain("ori-token.png");
    expect(html).not.toMatch(/SOL|bet_amount|Rank/);
  });
  it("viewer is case insensitive but no viewer means no You", () => {
    const address = "0xABCDEFabcdefABCDEFabcdefABCDEFabcdefABCD";
    let d = mineWinnersDisplay(
      { list: [row(address)] },
      round,
      address.toLowerCase() as `0x${string}`,
    );
    if (d.status === "populated") expect(d.rows[0].isCurrentUser).toBe(true);
    d = mineWinnersDisplay({ list: [row()] }, round);
    if (d.status === "populated") expect(d.rows[0].isCurrentUser).toBe(false);
  });
});
describe("winners query owner / isolation", () => {
  it("posts current result ID and optional viewer without +/-1, polls at approved10s", async () => {
    const request = vi.fn(async () => ({
        round_id: round.toString(),
        list: [row()],
      })),
      q = options(request),
      cache = new QueryClient();
    await cache.fetchQuery(q);
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "/round_winners/round",
        form: { round_id: round.toString(), winner_address: a },
        signal: expect.any(AbortSignal),
      }),
    );
    expect(q.refetchInterval).toBe(10000);
    expect(q.refetchIntervalInBackground).toBe(false);
    cache.clear();
  });
  it.each([
    { ...snapshot, randomnessFulfilled: false },
    { ...snapshot, initialized: false },
    { ...snapshot, winningSquare: undefined },
    { ...snapshot, winningSquare: 25 },
    undefined,
  ])("non-result state cannot request a winners list", async (snap) => {
    const request = vi.fn(),
      q = createMineWinnersQuery(context, snap, request, readConfig),
      cache = new QueryClient();
    expect(q.enabled).toBe(false);
    await expect(cache.fetchQuery({ ...q, retry: false })).rejects.toThrow(
      "context unavailable",
    );
    expect(request).not.toHaveBeenCalled();
    expect(q.refetchInterval).toBe(false);
    cache.clear();
  });
  it("isolates account, round, chain and backend; disconnected can request public winners", async () => {
    const request = vi.fn(async () => ({ list: [] })),
      aQuery = options(),
      bQuery = createMineWinnersQuery(
        { ...context, address: b },
        snapshot,
        request,
        readConfig,
      ),
      guest = createMineWinnersQuery(
        { ...context, address: undefined, ready: false },
        snapshot,
        request,
        readConfig,
      );
    expect(aQuery.queryKey).not.toEqual(bQuery.queryKey);
    expect(guest.enabled).toBe(true);
    const cache = new QueryClient();
    await cache.fetchQuery(guest);
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        form: { round_id: round.toString(), winner_address: "" },
      }),
    );
    expect(
      createMineWinnersQuery(
        { ...context, wrongChain: true },
        snapshot,
        request,
        readConfig,
      ).enabled,
    ).toBe(false);
    expect(
      createMineWinnersQuery(
        { ...context, targetChainId: 56 },
        snapshot,
        request,
        readConfig,
      ).enabled,
    ).toBe(false);
    expect(
      createMineWinnersQuery(
        context,
        { ...snapshot, roundId: round + BigInt(1) },
        request,
        readConfig,
      ).queryKey,
    ).not.toEqual(aQuery.queryKey);
    expect(
      createMineWinnersQuery(context, snapshot, request, () =>
        parsePublicConfig({
          NEXT_PUBLIC_APP_ENV: "development",
          NEXT_PUBLIC_API_BASE_URL: "https://other.test",
        }),
      ).queryKey,
    ).not.toEqual(aQuery.queryKey);
    cache.clear();
  });
  it("cancels stale request when old result/account leaves and does not seed new keys", async () => {
    let finish!: (value: unknown) => void;
    const request = vi.fn(
        () =>
          new Promise<unknown>((r) => {
            finish = r;
          }),
      ),
      q = createMineWinnersQuery(context, snapshot, request, readConfig),
      cache = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
    const pending = cache.fetchQuery(q);
    await Promise.resolve();
    await cache.cancelQueries({ queryKey: q.queryKey, exact: true });
    finish({ list: [row()] });
    await expect(pending).rejects.toThrow();
    const next = createMineWinnersQuery(
      { ...context, address: b },
      { ...snapshot, roundId: round + BigInt(1) },
      request,
      readConfig,
    );
    expect(cache.getQueryData(next.queryKey)).toBeUndefined();
    expect(cache.getQueryData(q.queryKey)).toBeUndefined();
    cache.clear();
  });
});
