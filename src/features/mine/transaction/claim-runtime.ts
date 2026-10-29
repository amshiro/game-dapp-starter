import {
  decodeEventLog,
  encodeFunctionData,
  type Hash,
  type PublicClient,
} from "viem";
import { getBalance, getConnection, writeContract } from "wagmi/actions";
import { getBalanceQueryOptions, readContractQueryOptions } from "wagmi/query";
import type { Config } from "wagmi";
import type { QueryClient } from "@tanstack/react-query";
import { getContractsForChain } from "../../../shared/config/evm-contracts";
import { createMineRewardsQuery } from "../read/mine-rewards-query";
import type { ManualContext, ManualReceipt } from "./manual-transaction";
import { ClaimFault, hasClaimReward } from "./claim-model";
import type { ClaimDependencies, ClaimOperation } from "./claim-transaction";
const contracts = getContractsForChain(97);
export function claimCall(o: ClaimOperation) {
  if (
    o.chainId !== 97 ||
    o.protocol.toLowerCase() !== contracts.oreProtocol.address.toLowerCase()
  )
    throw new ClaimFault("wrong-chain");
  // claimAll includes native + ORI; claimEth deliberately leaves ORI rewards to the canonical subsequent read.
  return {
    ...contracts.oreProtocol,
    functionName: o.kind,
    args: [o.account],
    account: o.account,
  } as const;
}
export function verifyClaim(o: ClaimOperation, receipt: ManualReceipt) {
  let native = false,
    ori = false;
  for (const log of receipt.logs) {
    try {
      if (log.address.toLowerCase() === o.protocol.toLowerCase()) {
        const e = decodeEventLog({
          abi: contracts.oreProtocol.abi,
          data: log.data,
          topics: [...log.topics] as [Hash, ...Hash[]],
        });
        if (
          e.eventName === "ClaimEth" &&
          e.args.miner.toLowerCase() === o.account.toLowerCase() &&
          e.args.to.toLowerCase() === o.account.toLowerCase() &&
          e.args.amount > BigInt(0)
        )
          native = true;
        if (
          e.eventName === "ClaimOre" &&
          e.args.miner.toLowerCase() === o.account.toLowerCase() &&
          e.args.amount > BigInt(0)
        )
          ori = true;
      } else if (
        o.kind === "claimAll" &&
        log.address.toLowerCase() === contracts.oriToken.address.toLowerCase()
      ) {
        const e = decodeEventLog({
          abi: contracts.oriToken.abi,
          data: log.data,
          topics: [...log.topics] as [Hash, ...Hash[]],
        });
        // Refined-only payouts may have no per-round ClaimOre. A canonical ORI transfer is also payout evidence.
        if (
          e.eventName === "Transfer" &&
          e.args.from.toLowerCase() === o.protocol.toLowerCase() &&
          e.args.to.toLowerCase() === o.account.toLowerCase() &&
          e.args.value > BigInt(0)
        )
          ori = true;
      }
    } catch {
      /* Unrelated/malformed logs cannot establish this claim. */
    }
  }
  if (!(o.kind === "claimEth" ? native : ori))
    throw new ClaimFault("verification-failed");
}
export function createClaimDependencies({
  client: getClient,
  context,
  config,
  queryClient,
  otherBusy = () => false,
}: {
  client: () => PublicClient | undefined;
  context: () => ManualContext;
  config: Config;
  queryClient: QueryClient;
  otherBusy?: () => boolean;
}): ClaimDependencies {
  let prepared:
    { operation: ClaimOperation; gas: bigint; gasPrice: bigint } | undefined;
  const incompatible = new Set<Hash>();
  function client() {
    const cl = getClient();
    if (cl?.chain?.id !== 97) throw new ClaimFault("wrong-chain");
    return cl;
  }
  function current(o?: ClaimOperation) {
    const c = context(),
      w = getConnection(config);
    if (
      c.targetChainId !== 97 ||
      c.wrongChain ||
      (w.status === "connected" && w.chainId !== 97)
    )
      throw new ClaimFault("wrong-chain");
    if (!c.ready || !c.address || w.status !== "connected")
      throw new ClaimFault("disconnected");
    if (
      w.address.toLowerCase() !== c.address.toLowerCase() ||
      (o && w.address.toLowerCase() !== o.account.toLowerCase())
    )
      throw new ClaimFault("account-changed");
    if (otherBusy()) throw new ClaimFault("rpc-error");
    return c;
  }
  async function fresh<T>(key: readonly unknown[], run: () => Promise<T>) {
    await queryClient.cancelQueries({ queryKey: key, exact: true });
    await queryClient.invalidateQueries({
      queryKey: key,
      exact: true,
      refetchType: "none",
    });
    return run();
  }
  async function gate(o: ClaimOperation) {
    current(o);
    const cl = client();
    if ((await cl.getChainId()) !== 97) throw new ClaimFault("wrong-chain");
    const q = createMineRewardsQuery(cl, {
      targetChainId: 97,
      ready: true,
      wrongChain: false,
      address: o.account,
    });
    const rewards = await fresh(q.queryKey, () =>
      queryClient.fetchQuery({ ...q, staleTime: 0 }),
    );
    if (!hasClaimReward(o.kind, rewards))
      throw new ClaimFault("nothing-to-claim");
    current(o);
  }
  return {
    protocol: contracts.oreProtocol.address,
    context: () => {
      current();
      return context();
    },
    prepare: async (o) => {
      prepared = undefined;
      await gate(o);
      const call = claimCall(o),
        cl = client();
      await cl.simulateContract(call);
      const [gas, gasPrice] = await Promise.all([
        cl.estimateContractGas(call),
        cl.getGasPrice(),
      ]);
      await gate(o);
      if ((await cl.getBalance({ address: o.account })) < gas * gasPrice)
        throw new ClaimFault("insufficient-native");
      await cl.simulateContract({ ...call, gas, gasPrice });
      current(o);
      prepared = { operation: o, gas, gasPrice };
    },
    send: async (o) => {
      current(o);
      if (prepared?.operation !== o)
        throw new ClaimFault("simulation-reverted");
      const p = prepared;
      prepared = undefined;
      return writeContract(config, {
        ...claimCall(o),
        chainId: 97,
        gas: p.gas,
        gasPrice: p.gasPrice,
      });
    },
    wait: async (o, hash, onHash) => {
      const expected = encodeFunctionData(claimCall(o)),
        cl = client();
      let changed = incompatible.has(hash);
      const r = await cl.waitForTransactionReceipt({
        hash,
        confirmations: 1,
        timeout: 120000,
        onReplaced: ({ reason, transaction: t }) => {
          onHash(t.hash);
          if (
            reason === "cancelled" ||
            t.from.toLowerCase() !== o.account.toLowerCase() ||
            t.to?.toLowerCase() !== o.protocol.toLowerCase() ||
            t.input.toLowerCase() !== expected.toLowerCase() ||
            t.value !== BigInt(0)
          ) {
            changed = true;
            incompatible.add(t.hash);
          }
        },
      });
      if (changed) throw new ClaimFault("replaced");
      const tx = await cl.getTransaction({ hash: r.transactionHash });
      if (
        tx.from.toLowerCase() !== o.account.toLowerCase() ||
        tx.to?.toLowerCase() !== o.protocol.toLowerCase() ||
        tx.input.toLowerCase() !== expected.toLowerCase() ||
        tx.value !== BigInt(0)
      )
        throw new ClaimFault("replaced");
      return {
        hash: r.transactionHash,
        status: r.status,
        blockNumber: r.blockNumber,
        logs: r.logs,
      };
    },
    verify: verifyClaim,
    refresh: async (o, minimum) => {
      const cl = client();
      if ((await cl.getChainId()) !== 97) throw new ClaimFault("wrong-chain");
      const block = await cl.getBlockNumber({ cacheTime: 0 });
      if (block < minimum) throw new ClaimFault("refresh-failed");
      // Refresh frozen-account keys after receipt, even if the user switched wallets. Never clear ORI locally for claimEth.
      const rewards = createMineRewardsQuery(
        cl,
        {
          targetChainId: 97,
          ready: true,
          wrongChain: false,
          address: o.account,
        },
        minimum,
      );
      const native = getBalanceQueryOptions(config, {
        address: o.account,
        chainId: 97,
      });
      const reads: Promise<unknown>[] = [
        fresh(rewards.queryKey, () =>
          queryClient.fetchQuery({ ...rewards, staleTime: 0 }),
        ),
        fresh(native.queryKey, () =>
          queryClient.fetchQuery({
            ...native,
            queryFn: () =>
              getBalance(config, {
                address: o.account,
                chainId: 97,
                blockNumber: block,
              }),
            staleTime: 0,
          }),
        ),
      ];
      if (o.kind === "claimAll") {
        const token = readContractQueryOptions(config, {
          ...contracts.oriToken,
          functionName: "balanceOf",
          args: [o.account],
          chainId: 97,
        });
        reads.push(
          fresh(token.queryKey, () =>
            queryClient.fetchQuery({
              ...token,
              queryFn: () =>
                cl.readContract({
                  ...contracts.oriToken,
                  functionName: "balanceOf",
                  args: [o.account],
                  blockNumber: block,
                }),
              staleTime: 0,
            }),
          ),
        );
      }
      await Promise.all(reads);
    },
  };
}
