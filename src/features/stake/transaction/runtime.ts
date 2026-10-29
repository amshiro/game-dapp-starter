import { encodeFunctionData, type PublicClient } from "viem";
import { getConnection, writeContract } from "wagmi/actions";
import type { Config } from "wagmi";
import type { QueryClient } from "@tanstack/react-query";
import { getBalanceQueryKey } from "wagmi/query";
import { getContractsForChain } from "../../../shared/config/evm-contracts";
import { createStakeReadQueries } from "../read/stake-read-queries";
import { createStakeAllowanceQuery } from "../read/stake-allowance";
import type { StakeReadContext } from "../read/stake-read-context";
import { StakeTxFault } from "./errors";
import type {
  StakeOperation,
  StakeStep,
  StakeTxDependencies,
} from "./stake-transaction";

const contracts = getContractsForChain(97);
const stakeWriteAbi = [
  ...contracts.oriToken.abi,
  ...contracts.oreProtocol.abi,
] as const;
export function stakeCall(o: StakeOperation, step: StakeStep) {
  if (
    o.chainId !== 97 ||
    o.token.toLowerCase() !== contracts.oriToken.address.toLowerCase() ||
    o.protocol.toLowerCase() !== contracts.oreProtocol.address.toLowerCase() ||
    o.view.toLowerCase() !== contracts.oreProtocolView.address.toLowerCase()
  )
    throw new StakeTxFault("wrong-chain");
  if (step === "approve")
    return {
      address: o.token,
      abi: stakeWriteAbi,
      functionName: "approve",
      args: [o.protocol, o.amount],
    } as const;
  if (step === "deposit")
    return {
      address: o.protocol,
      abi: stakeWriteAbi,
      functionName: "depositStake",
      args: [o.amount],
    } as const;
  return {
    address: o.protocol,
    abi: stakeWriteAbi,
    functionName: "withdrawStake",
    args: [o.amount, o.account],
  } as const;
}
export function operationContext(o: StakeOperation): StakeReadContext {
  return {
    targetChainId: 97,
    account: { status: "connected", address: o.account, chainId: 97 },
  };
}

export function createStakeTxDependencies({
  client: getClient,
  context,
  config,
  queryClient,
}: {
  client: () => PublicClient | undefined;
  context: () => StakeReadContext;
  config: Config;
  queryClient: QueryClient;
}): StakeTxDependencies {
  // Retain replacement intent across confirmation timeouts and explicit receipt retries.
  const incompatibleHashes = new Set<string>();
  function client() {
    const c = getClient();
    if (c?.chain?.id !== 97) throw new StakeTxFault("wrong-chain");
    return c;
  }
  async function block(minimum?: bigint) {
    const c = client();
    if ((await c.getChainId()) !== 97) throw new StakeTxFault("wrong-chain");
    const n = await c.getBlockNumber({ cacheTime: 0 });
    if (minimum !== undefined && n < minimum)
      throw new StakeTxFault("refresh-failed");
    return n;
  }
  async function reads(o: StakeOperation, minimum?: bigint) {
    const n = await block(minimum);
    return {
      q: createStakeReadQueries(client(), operationContext(o), n),
      allowance: createStakeAllowanceQuery(client(), operationContext(o), n),
    };
  }
  async function fresh<T>(
    options: { queryKey: readonly unknown[]; queryFn?: unknown },
    run: () => Promise<T>,
  ) {
    await queryClient.cancelQueries({
      queryKey: options.queryKey,
      exact: true,
    });
    await queryClient.invalidateQueries({
      queryKey: options.queryKey,
      exact: true,
      refetchType: "none",
    });
    return run();
  }
  return {
    contracts: {
      token: contracts.oriToken.address,
      protocol: contracts.oreProtocol.address,
      view: contracts.oreProtocolView.address,
    },
    context: () => {
      const c = context(),
        live = getConnection(config);
      if (c.account.status !== "connected") return c;
      if (live.chainId !== 97)
        return { ...c, account: { status: "wrong-chain" } };
      if (
        live.status !== "connected" ||
        live.address.toLowerCase() !== c.account.address.toLowerCase()
      )
        throw new StakeTxFault("account-changed");
      return c;
    },
    read: async (o) => {
      const { q, allowance: a } = await reads(o);
      const [available, staked, allowance] = await Promise.all([
        fresh(q.available, () =>
          queryClient.fetchQuery({ ...q.available, staleTime: 0 }),
        ),
        fresh(q.staked, () =>
          queryClient.fetchQuery({ ...q.staked, staleTime: 0 }),
        ),
        fresh(a, () => queryClient.fetchQuery({ ...a, staleTime: 0 })),
      ]);
      return { available, staked, allowance };
    },
    simulate: async (o, step) => {
      const call = stakeCall(o, step);
      if (call.functionName === "approve")
        await client().simulateContract({ ...call, account: o.account });
      else if (call.functionName === "depositStake")
        await client().simulateContract({ ...call, account: o.account });
      else await client().simulateContract({ ...call, account: o.account });
    },
    send: async (o, step) => {
      const live = getConnection(config);
      if (live.chainId !== 97) throw new StakeTxFault("wrong-chain");
      if (
        live.status !== "connected" ||
        live.address.toLowerCase() !== o.account.toLowerCase()
      )
        throw new StakeTxFault("account-changed");
      const call = stakeCall(o, step);
      if (call.functionName === "approve")
        return writeContract(config, {
          ...call,
          account: o.account,
          chainId: 97,
        });
      if (call.functionName === "depositStake")
        return writeContract(config, {
          ...call,
          account: o.account,
          chainId: 97,
        });
      return writeContract(config, {
        ...call,
        account: o.account,
        chainId: 97,
      });
    },
    wait: async (o, step, hash, onHash) => {
      const call = stakeCall(o, step),
        expected =
          call.functionName === "approve"
            ? encodeFunctionData(call)
            : call.functionName === "depositStake"
              ? encodeFunctionData(call)
              : encodeFunctionData(call);
      let changedIntent = incompatibleHashes.has(hash);
      const receipt = await client().waitForTransactionReceipt({
        hash,
        confirmations: 1,
        timeout: 120_000,
        onReplaced: ({ reason, transaction }) => {
          onHash(transaction.hash);
          if (
            reason === "cancelled" ||
            transaction.to?.toLowerCase() !== call.address.toLowerCase() ||
            transaction.from.toLowerCase() !== o.account.toLowerCase() ||
            transaction.input.toLowerCase() !== expected.toLowerCase() ||
            transaction.value !== BigInt(0)
          ) {
            changedIntent = true;
            incompatibleHashes.add(transaction.hash);
          }
        },
      });
      if (changedIntent) throw new StakeTxFault("replaced");
      return {
        hash: receipt.transactionHash,
        status: receipt.status,
        blockNumber: receipt.blockNumber,
      };
    },
    refresh: async (o, step, minimum) => {
      // Original account/chain keys only. A new connected account never receives this operation's balance data.
      const { q, allowance: a } = await reads(o, minimum);
      if (step === "approve") {
        const value = await fresh(a, () =>
          queryClient.fetchQuery({ ...a, staleTime: 0 }),
        );
        if (value < o.amount) throw new StakeTxFault("insufficient-allowance");
      } else {
        await Promise.all([
          fresh(q.available, () =>
            queryClient.fetchQuery({ ...q.available, staleTime: 0 }),
          ),
          fresh(q.staked, () =>
            queryClient.fetchQuery({ ...q.staked, staleTime: 0 }),
          ),
          fresh(q.total, () =>
            queryClient.fetchQuery({ ...q.total, staleTime: 0 }),
          ),
          ...(step === "deposit"
            ? [fresh(a, () => queryClient.fetchQuery({ ...a, staleTime: 0 }))]
            : []),
        ]);
      }
      await queryClient.invalidateQueries({
        queryKey: getBalanceQueryKey({ address: o.account, chainId: 97 }),
        refetchType: "none",
      });
    },
  };
}
