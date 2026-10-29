import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import {
  createPublicClient,
  custom,
  decodeFunctionData,
  encodeFunctionResult,
  type Address,
  type Hash,
  type TransactionReceipt,
  type Transaction,
} from "viem";
import { bscTestnet } from "viem/chains";
import type { Config } from "wagmi";
import { writeContract } from "wagmi/actions";
import { getContractsForChain } from "../../../shared/config/evm-contracts";
import { createStakeAllowanceQuery } from "../read/stake-allowance";
import { createStakeReadQueries } from "../read/stake-read-queries";
import {
  createStakeTxDependencies,
  operationContext,
  stakeCall,
} from "./runtime";
import type { StakeOperation } from "./stake-transaction";
const wallet = vi.hoisted(() => ({
  status: "connected",
  address: "0x0000000000000000000000000000000000000001",
  chainId: 97,
}));
vi.mock("wagmi/actions", () => ({
  getConnection: vi.fn(() => wallet),
  writeContract: vi.fn(async () => `0x${"1".repeat(64)}`),
}));
const a: Address = "0x0000000000000000000000000000000000000001",
  b: Address = "0x0000000000000000000000000000000000000002",
  c = getContractsForChain(97);
const operation: StakeOperation = {
  account: a,
  chainId: 97,
  amount: BigInt(1),
  kind: "deposit",
  token: c.oriToken.address,
  protocol: c.oreProtocol.address,
  view: c.oreProtocolView.address,
};
const hash = `0x${"1".repeat(64)}` as Hash,
  replacement = `0x${"2".repeat(64)}` as Hash;
function receiptFor(transactionHash: Hash): TransactionReceipt {
  return {
    status: "success",
    transactionHash,
    blockNumber: BigInt(30),
    blockHash: hash,
    contractAddress: null,
    cumulativeGasUsed: BigInt(0),
    effectiveGasPrice: BigInt(0),
    from: a,
    gasUsed: BigInt(0),
    logs: [],
    logsBloom: "0x",
    to: operation.protocol,
    transactionIndex: 0,
    type: "legacy",
  };
}
function transactionFor(transactionHash: Hash, input: Hash): Transaction {
  return {
    hash: transactionHash,
    input,
    from: a,
    to: operation.protocol,
    value: BigInt(0),
    gas: BigInt(21_000),
    gasPrice: BigInt(1),
    nonce: 0,
    blockHash: hash,
    blockNumber: BigInt(30),
    transactionIndex: 0,
    type: "legacy",
    typeHex: "0x0",
    chainId: 97,
    r: hash,
    s: hash,
    v: BigInt(27),
  };
}
function harness() {
  const tags: unknown[] = [];
  const raw = {
    native: BigInt(1000000),
    estimatedGas: BigInt(100),
    gasPrice: BigInt(100),
    depositPeak: "0xc8" as string | undefined,
    sequenceFails: false,
    sequenceUnsupported: false,
    balance: BigInt(100),
    stake: BigInt(10),
    total: BigInt(9000),
    allowance: BigInt(2),
    block: BigInt(30),
    failPersonal: false,
    failTotal: false,
  };
  const client = createPublicClient({
    chain: bscTestnet,
    transport: custom(
      {
        async request({ method, params }) {
          if (method === "eth_chainId") return "0x61";
          if (method === "eth_blockNumber")
            return `0x${raw.block.toString(16)}`;
          if (method === "eth_getBalance")
            return `0x${raw.native.toString(16)}`;
          if (method === "eth_estimateGas")
            return `0x${raw.estimatedGas.toString(16)}`;
          if (method === "eth_gasPrice")
            return `0x${raw.gasPrice.toString(16)}`;
          if (method === "eth_simulateV1") {
            if (raw.sequenceUnsupported) throw Error("method unsupported");
            return [
              {
                calls: [
                  { status: "0x1", gasUsed: "0x64", maxUsedGas: "0x64" },
                  {
                    status: raw.sequenceFails ? "0x0" : "0x1",
                    gasUsed: "0x64",
                    maxUsedGas: raw.depositPeak,
                  },
                ],
              },
            ];
          }
          if (method !== "eth_call") throw Error("Unexpected non-read RPC");
          const [call, tag] = params as [{ to: string; data: Hash }, string];
          tags.push(tag);
          if (call.to.toLowerCase() === c.oriToken.address.toLowerCase()) {
            const decoded = decodeFunctionData({
              abi: c.oriToken.abi,
              data: call.data,
            });
            if (decoded.functionName === "allowance")
              return encodeFunctionResult({
                abi: c.oriToken.abi,
                functionName: "allowance",
                result: raw.allowance,
              });
            if (decoded.functionName === "approve")
              return encodeFunctionResult({
                abi: c.oriToken.abi,
                functionName: "approve",
                result: true,
              });
            if (raw.failPersonal) throw Error("controlled read error");
            return encodeFunctionResult({
              abi: c.oriToken.abi,
              functionName: "balanceOf",
              result: raw.balance,
            });
          }
          if (
            call.to.toLowerCase() === c.oreProtocolView.address.toLowerCase()
          ) {
            const decoded = decodeFunctionData({
              abi: c.oreProtocolView.abi,
              data: call.data,
            });
            if (decoded.functionName === "getStakeInfo")
              return encodeFunctionResult({
                abi: c.oreProtocolView.abi,
                functionName: "getStakeInfo",
                result: [raw.stake, BigInt(0), BigInt(0), 0],
              });
            if (raw.failTotal) throw Error("controlled total error");
            return encodeFunctionResult({
              abi: c.oreProtocolView.abi,
              functionName: "getTreasuryState",
              result: [
                raw.total,
                BigInt(0),
                BigInt(0),
                BigInt(0),
                BigInt(0),
                BigInt(0),
              ],
            });
          }
          return "0x";
        },
      },
      { retryCount: 0 },
    ),
  });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const deps = createStakeTxDependencies({
    client: () => client,
    context: () => operationContext(operation),
    config: {} as Config,
    queryClient,
  });
  return { raw, client, queryClient, deps, tags };
}
beforeEach(() => {
  vi.clearAllMocks();
  wallet.status = "connected";
  wallet.address = a;
  wallet.chainId = 97;
});
describe("Stake runtime contracts and allowance", () => {
  it("uses proxy spender, exact amount and self recipient", async () => {
    const h = harness();
    for (const step of ["approve", "deposit", "withdraw"] as const) {
      await h.deps.simulate(operation, step);
      await h.deps.send(operation, step);
    }
    const calls = vi.mocked(writeContract).mock.calls.map((x) => x[1]);
    expect(calls[0]).toMatchObject({
      address: operation.token,
      functionName: "approve",
      args: [operation.protocol, BigInt(1)],
      account: a,
      chainId: 97,
    });
    expect(calls[1]).toMatchObject({
      address: operation.protocol,
      functionName: "depositStake",
      args: [BigInt(1)],
    });
    expect(calls[2]).toMatchObject({
      functionName: "withdrawStake",
      args: [BigInt(1), a],
    });
  });
  it("guards the live connector immediately before sending", async () => {
    const h = harness();
    wallet.address = b;
    await expect(h.deps.send(operation, "deposit")).rejects.toMatchObject({
      kind: "account-changed",
    });
    wallet.address = a;
    wallet.chainId = 56;
    await expect(h.deps.send(operation, "deposit")).rejects.toMatchObject({
      kind: "wrong-chain",
    });
    expect(writeContract).not.toHaveBeenCalled();
  });
  it("separates allowance by chain/token/spender/account and guards disabled manual fetch", async () => {
    const h = harness(),
      context = operationContext(operation);
    const q = createStakeAllowanceQuery(h.client, context);
    expect(q.queryKey).toContain(c.oriToken.address.toLowerCase());
    expect(q.queryKey).toContain(c.oreProtocol.address.toLowerCase());
    expect(q.queryKey).toContain(a.toLowerCase());
    expect(q.queryKey).not.toEqual(
      createStakeAllowanceQuery(h.client, {
        ...context,
        account: { status: "connected", address: b, chainId: 97 },
      }).queryKey,
    );
    const wrong = createStakeAllowanceQuery(h.client, {
      targetChainId: 97,
      account: { status: "wrong-chain" },
    });
    expect(wrong.enabled).toBe(false);
    await expect(
      h.queryClient.fetchQuery({ ...wrong, retry: false }),
    ).rejects.toThrow("unavailable");
    expect(h.tags).toHaveLength(0);
  });
  it("refreshes original account reads at a block not older than the receipt, without exact total delta assumptions", async () => {
    const h = harness();
    const bob = createStakeReadQueries(
      h.client,
      operationContext({ ...operation, account: b }),
    );
    h.queryClient.setQueryData(bob.available.queryKey, BigInt(777));
    await h.deps.refresh(operation, "deposit", BigInt(20));
    const alice = createStakeReadQueries(h.client, operationContext(operation));
    expect(h.queryClient.getQueryData(alice.available.queryKey)).toBe(
      BigInt(100),
    );
    expect(h.queryClient.getQueryData(alice.staked.queryKey)).toBe(BigInt(10));
    expect(h.queryClient.getQueryData(alice.total.queryKey)).toBe(BigInt(9000));
    expect(h.queryClient.getQueryData(bob.available.queryKey)).toBe(
      BigInt(777),
    );
    expect(h.tags.every((tag) => tag === "0x1e")).toBe(true);
  });
  it("does not accept an RPC view older than the confirmed block", async () => {
    const h = harness();
    await expect(
      h.deps.refresh(operation, "withdraw", BigInt(31)),
    ).rejects.toMatchObject({ kind: "refresh-failed" });
    expect(h.tags).toHaveLength(0);
  });
  it("rejects ineffective approval despite receipt success", async () => {
    const h = harness();
    h.raw.allowance = BigInt(0);
    await expect(
      h.deps.refresh(operation, "approve", BigInt(20)),
    ).rejects.toMatchObject({ kind: "insufficient-allowance" });
  });
  it("propagates personal refresh failure instead of claiming business success", async () => {
    const h = harness();
    h.raw.failPersonal = true;
    await expect(
      h.deps.refresh(operation, "withdraw", BigInt(20)),
    ).rejects.toThrow();
  });
  it("rejects a substituted contract deployment", () =>
    expect(() =>
      stakeCall({ ...operation, protocol: a }, "deposit"),
    ).toThrow());
  it("remembers cancelled intent when a timed-out replacement receipt is retried", async () => {
    const h = harness();
    vi.spyOn(h.client, "waitForTransactionReceipt")
      .mockImplementationOnce(async (options) => {
        options.onReplaced?.({
          reason: "cancelled",
          replacedTransaction: transactionFor(hash, "0x"),
          transaction: transactionFor(replacement, "0x"),
          transactionReceipt: receiptFor(replacement),
        });
        throw Error("receipt timeout");
      })
      .mockResolvedValueOnce(receiptFor(replacement));
    await expect(
      h.deps.wait(operation, "withdraw", hash, vi.fn()),
    ).rejects.toThrow("receipt timeout");
    await expect(
      h.deps.wait(operation, "withdraw", replacement, vi.fn()),
    ).rejects.toMatchObject({ kind: "replaced" });
    expect(writeContract).not.toHaveBeenCalled();
  });
  it.each(["repriced", "cancelled"] as const)(
    "handles %s replacement without automatic resend",
    async (reason) => {
      const h = harness(),
        call = stakeCall(operation, "withdraw");
      const { encodeFunctionData } = await import("viem");
      const data =
        call.functionName === "withdrawStake" ? encodeFunctionData(call) : "0x";
      vi.spyOn(h.client, "waitForTransactionReceipt").mockImplementation(
        async (options) => {
          options.onReplaced?.({
            reason,
            replacedTransaction: transactionFor(hash, data),
            transaction: transactionFor(replacement, data),
            transactionReceipt: receiptFor(replacement),
          });
          return receiptFor(replacement);
        },
      );
      const onHash = vi.fn();
      if (reason === "repriced") {
        expect(
          await h.deps.wait(operation, "withdraw", hash, onHash),
        ).toMatchObject({ hash: replacement, status: "success" });
      } else
        await expect(
          h.deps.wait(operation, "withdraw", hash, onHash),
        ).rejects.toMatchObject({ kind: "replaced" });
      expect(onHash).toHaveBeenCalledWith(replacement);
      expect(writeContract).not.toHaveBeenCalled();
      expect(
        vi.mocked(h.client.waitForTransactionReceipt).mock.calls[0][0],
      ).toMatchObject({ confirmations: 1, hash });
    },
  );
});

describe("Stake fee preflight", () => {
  it.each(["deposit", "withdraw"] as const)(
    "sends buffered %s fees and allows exact budget",
    async (step) => {
      const h = harness();
      h.raw.native = BigInt(11025);
      await h.deps.simulate(operation, step);
      await h.deps.send(operation, step);
      expect(writeContract).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ gas: BigInt(105), gasPrice: BigInt(105) }),
      );
    },
  );
  it("rejects funds sufficient for approval alone before opening wallet", async () => {
    const h = harness();
    h.raw.native = BigInt(11025);
    await expect(h.deps.simulate(operation, "approve")).rejects.toThrow(
      "insufficient-gas",
    );
    expect(writeContract).not.toHaveBeenCalled();
  });
  it.each([33074, 33075])(
    "checks both buffered budgets at BNB boundary %s",
    async (native) => {
      const h = harness();
      h.raw.native = BigInt(native);
      if (native === 33074)
        await expect(h.deps.simulate(operation, "approve")).rejects.toThrow(
          "insufficient-gas",
        );
      else {
        await h.deps.simulate(operation, "approve");
        await h.deps.send(operation, "approve");
        expect(writeContract).toHaveBeenCalledTimes(1);
      }
    },
  );
  it("uses peak deposit gas instead of post-refund gas used", async () => {
    const h = harness();
    h.raw.native = BigInt(22050);
    await expect(h.deps.simulate(operation, "approve")).rejects.toThrow(
      "insufficient-gas",
    );
  });
  it.each(["sequenceFails", "sequenceUnsupported"] as const)(
    "never sends when %s",
    async (key) => {
      const h = harness();
      h.raw[key] = true;
      await expect(h.deps.simulate(operation, "approve")).rejects.toThrow();
      expect(writeContract).not.toHaveBeenCalled();
    },
  );
  it("does not invent a deposit gas limit if RPC omits its peak", async () => {
    const h = harness();
    h.raw.depositPeak = undefined;
    await expect(h.deps.simulate(operation, "approve")).rejects.toThrow(
      "rpc-error",
    );
  });
  it("rechecks BNB after preparing, without reusing failed preparation", async () => {
    const h = harness();
    await h.deps.simulate(operation, "deposit");
    h.raw.native = BigInt(11024);
    await expect(h.deps.send(operation, "deposit")).rejects.toThrow(
      "insufficient-gas",
    );
    h.raw.native = BigInt(100000);
    await expect(h.deps.send(operation, "deposit")).rejects.toThrow(
      "simulation-reverted",
    );
    expect(writeContract).not.toHaveBeenCalled();
  });
  it("re-estimates after approval and stops when remaining BNB cannot cover deposit", async () => {
    const h = harness();
    await h.deps.simulate(operation, "approve");
    await h.deps.send(operation, "approve");
    h.raw.gasPrice = BigInt(200);
    h.raw.native = BigInt(11025);
    await expect(h.deps.simulate(operation, "deposit")).rejects.toThrow(
      "insufficient-gas",
    );
    expect(writeContract).toHaveBeenCalledTimes(1);
  });
});
