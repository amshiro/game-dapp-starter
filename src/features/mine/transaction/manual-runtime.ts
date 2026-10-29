import { bufferedGasFees } from "../../../shared/web3/evm/gas-budget";
import {
  decodeEventLog,
  encodeFunctionData,
  type PublicClient,
  type Hash,
} from "viem";
import type { Config } from "wagmi";
import { getConnection, writeContract, getBalance } from "wagmi/actions";
import { getBalanceQueryOptions } from "wagmi/query";
import type { QueryClient } from "@tanstack/react-query";
import { getContractsForChain } from "../../../shared/config/evm-contracts";
import { createMineAccountQueries } from "../read/mine-account-queries";
import { createMineBoardQuery } from "../read/mine-read-query";
import { assertFirstManualDeploy } from "./manual-model";
import { ManualFault } from "./manual-errors";
import type {
  ManualContext,
  ManualDependencies,
  ManualOperation,
  ManualReceipt,
} from "./manual-transaction";
const contracts = getContractsForChain(97);
export function manualCall(o: ManualOperation) {
  if (
    o.chainId !== 97 ||
    o.protocol.toLowerCase() !== contracts.oreProtocol.address.toLowerCase() ||
    o.view.toLowerCase() !== contracts.oreProtocolView.address.toLowerCase()
  )
    throw new ManualFault("wrong-chain");
  return {
    ...contracts.oreProtocol,
    functionName: "deployManual",
    args: [o.mask, o.amountPerSquare],
    value: o.value,
    account: o.account,
  } as const;
}
export function verifyDeploy(o: ManualOperation, r: ManualReceipt): bigint {
  const matches: bigint[] = [];
  for (const log of r.logs) {
    if (log.address.toLowerCase() !== o.protocol.toLowerCase()) continue;
    try {
      const e = decodeEventLog({
        abi: contracts.oreProtocol.abi,
        data: log.data,
        topics: [...log.topics] as [Hash, ...Hash[]],
      });
      if (
        e.eventName === "DeployEvent" &&
        e.args.miner.toLowerCase() === o.account.toLowerCase() &&
        e.args.mask === o.mask &&
        e.args.amountPerSquare === o.amountPerSquare &&
        e.args.totalAmount === o.value &&
        e.args.automation === false &&
        e.args.roundId > BigInt(0)
      )
        matches.push(e.args.roundId);
    } catch {
      /* Unrelated/unknown logs do not establish this operation's identity. */
    }
  }
  if (matches.length !== 1) throw new ManualFault("verification-failed");
  // Only a matching receipt event supplies operationRound. Never derive storedRound + 1.
  return matches[0];
}
export function createManualDependencies({
  client: getClient,
  context,
  config,
  queryClient,
}: {
  client: () => PublicClient | undefined;
  context: () => ManualContext;
  config: Config;
  queryClient: QueryClient;
}): ManualDependencies {
  const incompatibleHashes = new Set<Hash>();
  let prepared:
    { operation: ManualOperation; gas: bigint; gasPrice: bigint } | undefined;
  function client() {
    const c = getClient();
    if (c?.chain?.id !== 97) throw new ManualFault("wrong-chain");
    return c;
  }
  function current(o?: ManualOperation) {
    const c = context(),
      live = getConnection(config);
    if (!c.ready || !c.address) return c;
    if (live.status !== "connected") throw new ManualFault("disconnected");
    if (c.targetChainId !== 97 || c.wrongChain || live.chainId !== 97)
      throw new ManualFault("wrong-chain");
    if (
      live.address.toLowerCase() !== c.address.toLowerCase() ||
      (o && o.account.toLowerCase() !== live.address.toLowerCase())
    )
      throw new ManualFault("account-changed");
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
  async function gate(o: ManualOperation) {
    current(o);
    const cl = client();
    if ((await cl.getChainId()) !== 97) throw new ManualFault("wrong-chain");
    const block = await cl.getBlock({ blockTag: "latest" });
    if (block.number === null) throw new ManualFault("round-unavailable");
    const at = { blockNumber: block.number };
    const [board, info, automation] = await Promise.all([
      cl.readContract({
        ...contracts.oreProtocol,
        functionName: "board",
        ...at,
      }),
      cl.readContract({
        ...contracts.oreProtocolView,
        functionName: "getCurrentRoundInfo",
        ...at,
      }),
      cl.readContract({
        ...contracts.oreProtocol,
        functionName: "getAutomation",
        args: [o.account],
        ...at,
      }),
    ]);
    // Recheck chain active even for a stale Manual draft captured before the Running Card replaced the form.
    if (automation.active) throw new ManualFault("round-unavailable");
    if (!board[6] || !info[4] || board[0] !== info[0])
      throw new ManualFault("round-unavailable");
    const round = await cl.readContract({
      ...contracts.oreProtocolView,
      functionName: "getRoundData",
      args: [info[0]],
      ...at,
    });
    if (round.id !== info[0]) throw new ManualFault("round-unavailable");
    {
      const q = createMineAccountQueries(
        cl,
        { chainId: 97, account: o.account, roundId: info[0], enabled: true },
        block.number,
      );
      const [participation, own] = await Promise.all([
        fresh(q.info.queryKey, () =>
          queryClient.fetchQuery({ ...q.info, staleTime: 0 }),
        ),
        fresh(q.squares.queryKey, () =>
          queryClient.fetchQuery({ ...q.squares, staleTime: 0 }),
        ),
      ]);
      // A fulfilled stored round is historical, but both account reads must still succeed.
      // Never infer its successor ID; the contract chooses the operation round.
      if (!round.randomnessFulfilled)
        assertFirstManualDeploy(participation, own);
    }
    // A fulfilled stored round may precede the deployable one. Do not constrain the next round using old owned cells.
    const balance = await cl.getBalance({ address: o.account });
    if (balance < o.value) throw new ManualFault("insufficient-native");
    current(o);
    return { round: info[0], canDeploy: info[4], balance };
  }
  async function refreshBoard(minimum?: bigint) {
    const q = createMineBoardQuery(
      client(),
      { targetChainId: 97, wrongChain: false },
      minimum,
    );
    await fresh(q.queryKey, () =>
      queryClient.fetchQuery({ ...q, staleTime: 0 }),
    );
  }
  return {
    contracts: {
      protocol: contracts.oreProtocol.address,
      view: contracts.oreProtocolView.address,
    },
    context: () => current(),
    prepare: async (o) => {
      prepared = undefined;
      const before = await gate(o),
        call = manualCall(o);
      await client().simulateContract(call);
      const [estimatedGas, currentGasPrice] = await Promise.all([
        client().estimateContractGas(call),
        client().getGasPrice(),
      ]);
      const { gas, gasPrice } = bufferedGasFees(estimatedGas, currentGasPrice);
      const after = await gate(o);
      if (after.round !== before.round || after.canDeploy !== before.canDeploy)
        throw new ManualFault("round-unavailable");
      if (after.balance < o.value + gas * gasPrice)
        throw new ManualFault("insufficient-native");
      // Simulate every attempt again after the fresh round/balance check; a previous simulation is not a permission cache.
      await client().simulateContract({ ...call, gas, gasPrice });
      current(o);
      prepared = { operation: o, gas, gasPrice };
    },
    send: async (o) => {
      current(o);
      if (prepared?.operation !== o)
        throw new ManualFault("simulation-reverted");
      const fees = prepared;
      prepared = undefined;
      if (
        (await client().getBalance({
          address: o.account,
          blockTag: "pending",
        })) <
        o.value + fees.gas * fees.gasPrice
      )
        throw new ManualFault("insufficient-native");
      current(o);
      return writeContract(config, {
        ...manualCall(o),
        chainId: 97,
        gas: fees.gas,
        gasPrice: fees.gasPrice,
      });
    },
    wait: async (o, hash, onHash) => {
      const expected = encodeFunctionData(manualCall(o));
      let changed = incompatibleHashes.has(hash);
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
            t.value !== o.value
          ) {
            changed = true;
            incompatibleHashes.add(t.hash);
          }
        },
      });
      if (changed) throw new ManualFault("replaced");
      return {
        hash: r.transactionHash,
        status: r.status,
        blockNumber: r.blockNumber,
        logs: r.logs,
      };
    },
    verify: verifyDeploy,
    refresh: async (o, round, minimum) => {
      const cl = client();
      if ((await cl.getChainId()) !== 97) throw new ManualFault("wrong-chain");
      const block = await cl.getBlockNumber({ cacheTime: 0 });
      if (block < minimum) throw new ManualFault("refresh-failed");
      // Refresh original operation account/round keys, never the now-connected wallet's personal data.
      const q = createMineAccountQueries(
          cl,
          { chainId: 97, account: o.account, roundId: round, enabled: true },
          block,
        ),
        balance = getBalanceQueryOptions(config, {
          chainId: 97,
          address: o.account,
        });
      await Promise.all([
        refreshBoard(minimum),
        fresh(q.info.queryKey, () =>
          queryClient.fetchQuery({ ...q.info, staleTime: 0 }),
        ),
        fresh(q.squares.queryKey, () =>
          queryClient.fetchQuery({ ...q.squares, staleTime: 0 }),
        ),
        fresh(balance.queryKey, () =>
          queryClient.fetchQuery({
            ...balance,
            queryFn: () =>
              getBalance(config, {
                chainId: 97,
                address: o.account,
                blockNumber: block,
              }),
            staleTime: 0,
          }),
        ),
      ]);
    },
    refreshBoard: () => refreshBoard(),
  };
}
