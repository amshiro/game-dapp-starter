import { bufferedGasFees } from "../../../shared/web3/evm/gas-budget";
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
  let prepared:
    | {
        operation: StakeOperation;
        step: StakeStep;
        gas: bigint;
        gasPrice: bigint;
        budget: bigint;
      }
    | undefined;
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
      prepared = undefined;
      const call = stakeCall(o, step);
      const simulate = async (fees?: { gas: bigint; gasPrice: bigint }) => {
        if (call.functionName === "approve")
          await client().simulateContract({
            ...call,
            account: o.account,
            ...fees,
          });
        else if (call.functionName === "depositStake")
          await client().simulateContract({
            ...call,
            account: o.account,
            ...fees,
          });
        else
          await client().simulateContract({
            ...call,
            account: o.account,
            ...fees,
          });
      };
      await simulate();
      const [estimatedGas, currentGasPrice] = await Promise.all([
        call.functionName === "approve"
          ? client().estimateContractGas({ ...call, account: o.account })
          : call.functionName === "depositStake"
            ? client().estimateContractGas({ ...call, account: o.account })
            : client().estimateContractGas({ ...call, account: o.account }),
        client().getGasPrice(),
      ]);
      const fees = bufferedGasFees(estimatedGas, currentGasPrice);
      let budget = fees.budget;
      if (step === "approve") {
        // The second call observes the first call's temporary state. Nothing is signed or broadcast.
        // Use peak gas, not post-refund gasUsed, to avoid underestimating the transaction gas limit.
        const approve = stakeCall(o, "approve");
        const deposit = stakeCall(o, "deposit");
        const blocks = await client().request({
          method: "eth_simulateV1",
          params: [
            {
              blockStateCalls: [
                {
                  calls: [
                    {
                      from: o.account,
                      to: approve.address,
                      data: encodeFunctionData(approve),
                    },
                    {
                      from: o.account,
                      to: deposit.address,
                      data: encodeFunctionData(deposit),
                    },
                  ],
                },
              ],
              validation: false,
            },
            "latest",
          ],
        });
        const calls = blocks[0]?.calls;
        if (
          calls?.length !== 2 ||
          calls.some((result) => result.status !== "0x1")
        )
          throw new StakeTxFault("simulation-reverted");
        const peak = (calls[1] as { maxUsedGas?: string }).maxUsedGas;
        if (!peak || !/^0x[0-9a-f]+$/i.test(peak))
          throw new StakeTxFault("rpc-error");
        const depositFees = bufferedGasFees(BigInt(peak), currentGasPrice);
        budget += depositFees.budget;
      }
      if (
        (await client().getBalance({
          address: o.account,
          blockTag: "pending",
        })) < budget
      )
        throw new StakeTxFault("insufficient-gas");
      await simulate({ gas: fees.gas, gasPrice: fees.gasPrice });
      prepared = {
        operation: o,
        step,
        gas: fees.gas,
        gasPrice: fees.gasPrice,
        budget,
      };
    },
    send: async (o, step) => {
      const live = getConnection(config);
      if (live.chainId !== 97) throw new StakeTxFault("wrong-chain");
      if (
        live.status !== "connected" ||
        live.address.toLowerCase() !== o.account.toLowerCase()
      )
        throw new StakeTxFault("account-changed");
      const fees = prepared;
      prepared = undefined;
      if (!fees || fees.operation !== o || fees.step !== step)
        throw new StakeTxFault("simulation-reverted");
      if (
        (await client().getBalance({
          address: o.account,
          blockTag: "pending",
        })) < fees.budget
      )
        throw new StakeTxFault("insufficient-gas");
      const latest = getConnection(config);
      if (latest.chainId !== 97) throw new StakeTxFault("wrong-chain");
      if (
        latest.status !== "connected" ||
        latest.address.toLowerCase() !== o.account.toLowerCase()
      )
        throw new StakeTxFault("account-changed");
      const call = stakeCall(o, step);
      if (call.functionName === "approve")
        return writeContract(config, {
          ...call,
          account: o.account,
          chainId: 97,
          gas: fees.gas,
          gasPrice: fees.gasPrice,
        });
      if (call.functionName === "depositStake")
        return writeContract(config, {
          ...call,
          account: o.account,
          chainId: 97,
          gas: fees.gas,
          gasPrice: fees.gasPrice,
        });
      return writeContract(config, {
        ...call,
        account: o.account,
        chainId: 97,
        gas: fees.gas,
        gasPrice: fees.gasPrice,
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
