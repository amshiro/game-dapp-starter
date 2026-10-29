import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import {
  createPublicClient,
  custom,
  decodeFunctionData,
  encodeAbiParameters,
  encodeEventTopics,
  encodeFunctionResult,
  zeroAddress,
  type Address,
  type Hash,
} from "viem";
import { bscTestnet } from "viem/chains";
import type { Config } from "wagmi";
import { writeContract } from "wagmi/actions";
import { getContractsForChain } from "../../../shared/config/evm-contracts";
import { autoIntent } from "./auto-model";
import {
  autoCall,
  createAutoDependencies,
  verifyAutomation,
} from "./auto-runtime";
import type { AutoOperation } from "./auto-transaction";
import type { ManualReceipt } from "./manual-transaction";
const wallet = vi.hoisted(() => ({
  status: "connected",
  chainId: 97,
  address: "0x0000000000000000000000000000000000000001",
}));
vi.mock("wagmi/actions", () => ({
  getConnection: () => wallet,
  writeContract: vi.fn(async () => `0x${"1".repeat(64)}`),
  getBalance: vi.fn(async () => ({ value: BigInt(100) })),
}));
vi.mock("../../../shared/api/ori-backend", () => ({
  requestOriBackend: vi.fn(async () => null),
}));
const c = getContractsForChain(97).oreProtocol,
  a = wallet.address as Address;
const intent = autoIntent([0, 24], "2", "1", "0.000001", BigInt(1));
const operation: AutoOperation = {
  kind: "register",
  account: a,
  chainId: 97,
  protocol: c.address,
  intent,
};
function harness() {
  const raw = {
    active: false,
    failRead: false,
    failSimulation: false,
    balance: intent.value + BigInt(100000),
    fee: BigInt(1),
  };
  let simulations = 0;
  const client = createPublicClient({
    chain: bscTestnet,
    transport: custom(
      {
        async request({ method, params }) {
          if (method === "eth_chainId") return "0x61";
          if (method === "eth_getBalance")
            return `0x${raw.balance.toString(16)}`;
          if (method === "eth_gasPrice") return "0x1";
          if (method === "eth_estimateGas") return "0x5208";
          if (method === "eth_blockNumber") return "0x64";
          if (method !== "eth_call")
            throw Error("Unexpected RPC; test transport cannot send");
          const [call] = params as [{ data: Hash }];
          const d = decodeFunctionData({ abi: c.abi, data: call.data });
          if (d.functionName === "getAutomation") {
            if (raw.failRead) throw Error("Controlled read failure");
            return encodeFunctionResult({
              abi: c.abi,
              functionName: "getAutomation",
              result: {
                owner: raw.active ? a : zeroAddress,
                balance: BigInt(0),
                mask: BigInt(0),
                amountPerSquare: BigInt(0),
                randomizeMask: false,
                active: raw.active,
                botFee: raw.fee,
              },
            });
          }
          if (d.functionName === "config")
            return encodeFunctionResult({
              abi: c.abi,
              functionName: "config",
              result: [
                a,
                a,
                a,
                a,
                `0x${"0".repeat(64)}`,
                BigInt(1),
                1,
                1,
                raw.fee,
              ],
            });
          if (
            d.functionName === "registerAutomation" ||
            d.functionName === "stopAutomation"
          ) {
            simulations++;
            if (raw.failSimulation) throw Error("Controlled simulation revert");
            return "0x";
          }
          throw Error("Unexpected ABI read");
        },
      },
      { retryCount: 0 },
    ),
  });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const deps = createAutoDependencies({
    client: () => client,
    context: () => ({
      address: wallet.address as Address,
      targetChainId: 97,
      ready: wallet.status === "connected",
      wrongChain: wallet.chainId !== 97,
    }),
    config: {} as Config,
    queryClient: qc,
  });
  return { deps, raw, qc, simulations: () => simulations };
}
beforeEach(() => {
  vi.clearAllMocks();
  wallet.chainId = 97;
  wallet.address = a;
  wallet.status = "connected";
});
describe("Auto RPC boundary", () => {
  it("uses verified defaults and exact principal+fee value, twice simulates before signing", async () => {
    const h = harness();
    await h.deps.prepare(operation);
    expect(h.simulations()).toBe(2);
    expect(writeContract).not.toHaveBeenCalled();
    await h.deps.send(operation);
    expect(writeContract).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        functionName: "registerAutomation",
        value: intent.value,
        account: a,
        args: [
          expect.objectContaining({
            owner: a,
            balance: BigInt(0),
            botFee: BigInt(0),
            active: true,
            mask: intent.mask,
          }),
        ],
      }),
    );
    await expect(h.deps.send(operation)).rejects.toThrow("simulation-reverted");
    h.qc.clear();
  });
  it.each([
    "active",
    "unknown",
    "fee",
    "principal-only",
    "no-gas",
    "simulation",
  ])("fails closed for %s", async (kind) => {
    const h = harness();
    if (kind === "active") h.raw.active = true;
    if (kind === "unknown") h.raw.failRead = true;
    if (kind === "fee") h.raw.fee = BigInt(2);
    if (kind === "principal-only") h.raw.balance = intent.displayTotal;
    if (kind === "no-gas") h.raw.balance = intent.value;
    if (kind === "simulation") h.raw.failSimulation = true;
    await expect(h.deps.prepare(operation)).rejects.toThrow();
    expect(writeContract).not.toHaveBeenCalled();
    h.qc.clear();
  });
  it("stops only self with no payable value and never sends a refund", async () => {
    const h = harness();
    const o = { ...operation, kind: "stop" as const, intent: undefined };
    await expect(h.deps.prepare(o)).rejects.toThrow("not-active");
    h.raw.active = true;
    await h.deps.prepare(o);
    await h.deps.send(o);
    expect(writeContract).toHaveBeenCalledTimes(1);
    expect(writeContract).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        functionName: "stopAutomation",
        args: [a],
        value: undefined,
      }),
    );
    h.qc.clear();
  });
  it.each(["chain", "account"])(
    "rechecks provider %s before signing",
    async (kind) => {
      const h = harness();
      await h.deps.prepare(operation);
      if (kind === "chain") wallet.chainId = 56;
      else wallet.address = "0x0000000000000000000000000000000000000002";
      await expect(h.deps.send(operation)).rejects.toThrow();
      expect(writeContract).not.toHaveBeenCalled();
      h.qc.clear();
    },
  );
  it("refreshes original-account scoped queries and fails Stop if still active", async () => {
    const h = harness();
    wallet.address = "0x0000000000000000000000000000000000000002";
    await h.deps.refresh(operation, BigInt(100));
    const accountKeys = h.qc
      .getQueryCache()
      .getAll()
      .map((q) => q.queryKey)
      .filter((key) => key.at(-1) !== "config");
    expect(accountKeys.some((key) => key.includes(a.toLowerCase()))).toBe(true);
    expect(
      accountKeys.some((key) => key.includes(wallet.address.toLowerCase())),
    ).toBe(false);
    h.raw.active = true;
    await expect(
      h.deps.refresh({ ...operation, kind: "stop" }, BigInt(100)),
    ).rejects.toThrow("refresh-failed");
    h.qc.clear();
  });
});
function receipt(
  o: AutoOperation = operation,
  overrides: Record<string, unknown> = {},
): ManualReceipt {
  const call = autoCall(o),
    cfg = {
      owner: a,
      balance: o.kind === "stop" ? BigInt(0) : intent.value,
      mask: intent.mask,
      amountPerSquare: intent.amountPerSquare,
      randomizeMask: intent.randomizeMask,
      active: o.kind !== "stop",
      botFee: intent.executorFee,
      ...overrides,
    };
  return {
    hash: `0x${"1".repeat(64)}`,
    status: "success",
    blockNumber: BigInt(100),
    logs: [
      {
        address: call.address,
        topics: encodeEventTopics({
          abi: c.abi,
          eventName: "AutomationUpdated",
          args: { user: a },
        }) as [Hash, ...Hash[]],
        data: encodeAbiParameters(
          [
            {
              type: "tuple",
              components: [
                { name: "owner", type: "address" },
                { name: "balance", type: "uint256" },
                { name: "mask", type: "uint256" },
                { name: "amountPerSquare", type: "uint256" },
                { name: "randomizeMask", type: "bool" },
                { name: "active", type: "bool" },
                { name: "botFee", type: "uint96" },
              ],
            },
            { type: "uint64" },
          ],
          [cfg, BigInt(100)],
        ),
      },
    ],
  };
}
describe("matching AutomationUpdated", () => {
  it("verifies register and stop without demanding deleted event fields be zero", () => {
    verifyAutomation(operation, receipt());
    const stop = { ...operation, kind: "stop" as const };
    verifyAutomation(stop, receipt(stop));
  });
  it.each([
    { mask: BigInt(3) },
    { balance: intent.value + BigInt(1) },
    { botFee: BigInt(99) },
    { active: false },
    { randomizeMask: true },
  ])("rejects mismatched intent", (override) =>
    expect(() =>
      verifyAutomation(operation, receipt(operation, override)),
    ).toThrow("verification-failed"),
  );
  it("rejects unknown emitter and duplicate events", () => {
    const r = receipt();
    r.logs = [{ ...r.logs[0], address: a }];
    expect(() => verifyAutomation(operation, r)).toThrow();
    const duplicate = receipt();
    duplicate.logs = [...duplicate.logs, ...duplicate.logs];
    expect(() => verifyAutomation(operation, duplicate)).toThrow();
  });
});
