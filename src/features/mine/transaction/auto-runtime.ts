import {
  decodeEventLog,
  encodeFunctionData,
  formatEther,
  type PublicClient,
  type Hash,
} from "viem";
import { getConnection, writeContract, getBalance } from "wagmi/actions";
import { getBalanceQueryOptions } from "wagmi/query";
import type { Config } from "wagmi";
import type { QueryClient } from "@tanstack/react-query";
import { getContractsForChain } from "../../../shared/config/evm-contracts";
import { createAutomationQueries } from "../read/mine-automation-queries";
import type { ManualContext, ManualReceipt } from "./manual-transaction";
import { AutoFault, autoIntent } from "./auto-model";
import type { AutoDependencies, AutoOperation } from "./auto-transaction";
const protocol = getContractsForChain(97).oreProtocol;
export function autoCall(o: AutoOperation) {
  if (
    o.chainId !== 97 ||
    o.protocol.toLowerCase() !== protocol.address.toLowerCase()
  )
    throw new AutoFault("wrong-chain");
  if (o.kind === "stop")
    return {
      ...protocol,
      functionName: "stopAutomation",
      value: undefined,
      args: [o.account],
      account: o.account,
    } as const;
  const i = o.intent;
  if (!i) throw new AutoFault("invalid-amount");
  return {
    ...protocol,
    functionName: "registerAutomation",
    args: [
      {
        owner: o.account,
        balance: BigInt(0),
        mask: i.mask,
        amountPerSquare: i.amountPerSquare,
        randomizeMask: i.randomizeMask,
        active: true,
        botFee: BigInt(0),
      },
    ],
    account: o.account,
    value: i.value,
  } as const;
}
export function verifyAutomation(o: AutoOperation, receipt: ManualReceipt) {
  let matches = 0;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== o.protocol.toLowerCase()) continue;
    try {
      const event = decodeEventLog({
        abi: protocol.abi,
        data: log.data,
        topics: [...log.topics] as [Hash, ...Hash[]],
      });
      if (
        event.eventName !== "AutomationUpdated" ||
        event.args.user.toLowerCase() !== o.account.toLowerCase()
      )
        continue;
      const c = event.args.cfg,
        i = o.intent;
      if (c.owner.toLowerCase() !== o.account.toLowerCase()) continue;
      if (
        o.kind === "stop"
          ? !c.active && c.balance === BigInt(0)
          : i &&
            c.active &&
            c.mask === i.mask &&
            c.amountPerSquare === i.amountPerSquare &&
            c.randomizeMask === i.randomizeMask &&
            c.balance === i.value &&
            c.botFee === i.executorFee
      )
        matches++;
    } catch {
      /* Unknown/unrelated logs do not establish this operation. */
    }
  }
  if (matches !== 1) throw new AutoFault("verification-failed");
}
export function createAutoDependencies({
  client: getClient,
  context,
  config,
  queryClient,
}: {
  client: () => PublicClient | undefined;
  context: () => ManualContext;
  config: Config;
  queryClient: QueryClient;
}): AutoDependencies {
  let prepared:
    { operation: AutoOperation; gas: bigint; gasPrice: bigint } | undefined;
  const incompatible = new Set<Hash>();
  function client() {
    const c = getClient();
    if (c?.chain?.id !== 97) throw new AutoFault("wrong-chain");
    return c;
  }
  function current(o?: AutoOperation) {
    const c = context(),
      w = getConnection(config);
    if (
      c.targetChainId !== 97 ||
      c.wrongChain ||
      (w.status === "connected" && w.chainId !== 97)
    )
      throw new AutoFault("wrong-chain");
    if (!c.ready || !c.address || w.status !== "connected")
      throw new AutoFault("disconnected");
    if (
      w.address.toLowerCase() !== c.address.toLowerCase() ||
      (o && w.address.toLowerCase() !== o.account.toLowerCase())
    )
      throw new AutoFault("account-changed");
    return c;
  }
  async function fresh<T>(key: readonly unknown[], read: () => Promise<T>) {
    await queryClient.cancelQueries({ queryKey: key, exact: true });
    await queryClient.invalidateQueries({
      queryKey: key,
      exact: true,
      refetchType: "none",
    });
    return read();
  }
  async function gate(o: AutoOperation) {
    current(o);
    const cl = client();
    if ((await cl.getChainId()) !== 97) throw new AutoFault("wrong-chain");
    const [automation, config, balance] = await Promise.all([
      cl.readContract({
        ...protocol,
        functionName: "getAutomation",
        args: [o.account],
      }),
      cl.readContract({ ...protocol, functionName: "config" }),
      cl.getBalance({ address: o.account }),
    ]);
    if (
      automation.active &&
      automation.owner.toLowerCase() !== o.account.toLowerCase()
    )
      throw new AutoFault("rpc-error");
    if (o.kind === "stop") {
      if (!automation.active) throw new AutoFault("not-active");
    } else {
      if (automation.active) throw new AutoFault("already-active");
      const i = o.intent;
      if (!i) throw new AutoFault("invalid-amount");
      if (i.executorFee !== config[8]) throw new AutoFault("fee-changed");
      const selected = i.randomizeMask
        ? []
        : Array.from({ length: 25 }, (_, n) => n).filter(
            (n) => !!(i.mask & (BigInt(1) << BigInt(n))),
          );
      const checked = autoIntent(
        selected,
        i.cellsPerRound.toString(),
        i.rounds.toString(),
        formatEther(i.amountPerSquare),
        config[8],
      );
      if (
        checked.value !== i.value ||
        checked.mask !== i.mask ||
        checked.cellsPerRound !== i.cellsPerRound
      )
        throw new AutoFault("invalid-mask");
      if (balance < i.value) throw new AutoFault("insufficient-native");
    }
    current(o);
    return balance;
  }
  async function simulate(
    o: AutoOperation,
    fees?: { gas: bigint; gasPrice: bigint },
  ) {
    const call = autoCall(o);
    if (call.functionName === "stopAutomation")
      await client().simulateContract({ ...call, ...fees });
    else await client().simulateContract({ ...call, ...fees });
  }
  async function estimate(o: AutoOperation) {
    const call = autoCall(o);
    return call.functionName === "stopAutomation"
      ? client().estimateContractGas(call)
      : client().estimateContractGas(call);
  }
  return {
    protocol: protocol.address,
    context: () => {
      current();
      return context();
    },
    prepare: async (o) => {
      prepared = undefined;
      await gate(o);
      const call = autoCall(o);
      await simulate(o);
      const [gas, gasPrice] = await Promise.all([
        estimate(o),
        client().getGasPrice(),
      ]);
      const balance = await gate(o);
      if (balance < (call.value ?? BigInt(0)) + gas * gasPrice)
        throw new AutoFault("insufficient-native");
      await simulate(o, { gas, gasPrice });
      current(o);
      prepared = { operation: o, gas, gasPrice };
    },
    send: async (o) => {
      current(o);
      if (prepared?.operation !== o) throw new AutoFault("simulation-reverted");
      const p = prepared;
      prepared = undefined;
      const call = autoCall(o),
        fees = { chainId: 97, gas: p.gas, gasPrice: p.gasPrice } as const;
      return call.functionName === "stopAutomation"
        ? writeContract(config, { ...call, ...fees })
        : writeContract(config, { ...call, ...fees });
    },
    wait: async (o, hash, onHash) => {
      const call = autoCall(o),
        expected = encodeFunctionData(call);
      let changed = incompatible.has(hash);
      const r = await client().waitForTransactionReceipt({
        hash,
        confirmations: 1,
        timeout: 120_000,
        onReplaced: ({ reason, transaction: t }) => {
          onHash(t.hash);
          if (
            reason === "cancelled" ||
            t.from.toLowerCase() !== o.account.toLowerCase() ||
            t.to?.toLowerCase() !== o.protocol.toLowerCase() ||
            t.input.toLowerCase() !== expected.toLowerCase() ||
            t.value !== (call.value ?? BigInt(0))
          ) {
            changed = true;
            incompatible.add(t.hash);
          }
        },
      });
      if (changed) throw new AutoFault("replaced");
      return {
        hash: r.transactionHash,
        status: r.status,
        blockNumber: r.blockNumber,
        logs: r.logs,
      };
    },
    verify: verifyAutomation,
    refresh: async (o, minimum) => {
      const cl = client();
      if ((await cl.getChainId()) !== 97) throw new AutoFault("wrong-chain");
      const block = await cl.getBlockNumber({ cacheTime: 0 });
      if (block < minimum) throw new AutoFault("refresh-failed");
      // Original transaction account keys survive a wallet switch; no refresh writes into the new wallet's state.
      const q = createAutomationQueries(cl, o.account, true, block),
        balance = getBalanceQueryOptions(config, {
          address: o.account,
          chainId: 97,
        });
      const [automation] = await Promise.all([
        fresh(q.account.queryKey, () =>
          queryClient.fetchQuery({ ...q.account, staleTime: 0 }),
        ),
        fresh(q.enrichment.queryKey, () =>
          queryClient.fetchQuery({ ...q.enrichment, staleTime: 0 }),
        ),
        fresh(q.config.queryKey, () =>
          queryClient.fetchQuery({ ...q.config, staleTime: 0 }),
        ),
        fresh(balance.queryKey, () =>
          queryClient.fetchQuery({
            ...balance,
            queryFn: () =>
              getBalance(config, {
                address: o.account,
                chainId: 97,
                blockNumber: block,
              }),
            staleTime: 0,
          }),
        ),
      ]);
      if (o.kind === "stop" && automation.active)
        throw new AutoFault("refresh-failed");
    },
  };
}
