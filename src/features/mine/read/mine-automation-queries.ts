import { queryOptions } from "@tanstack/react-query";
import type { Address, PublicClient } from "viem";
import { getContractsForChain } from "../../../shared/config/evm-contracts";
import { requestOriBackend } from "../../../shared/api/ori-backend";
const protocol = getContractsForChain(97).oreProtocol;
export type Automation = Readonly<{
  owner: Address;
  balance: bigint;
  mask: bigint;
  amountPerSquare: bigint;
  randomizeMask: boolean;
  active: boolean;
  botFee: bigint;
}>;
export type AutomationEnrichment = Readonly<{ remaining?: string }>;
export function automationEnrichment(
  raw: unknown,
  account: Address,
): AutomationEnrichment {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const r = raw as Record<string, unknown>;
  if (
    r.user !== undefined &&
    (typeof r.user !== "string" ||
      r.user.toLowerCase() !== account.toLowerCase())
  )
    throw Error("Automation enrichment account mismatch");
  const extra = r.extend_data;
  if (!extra || typeof extra !== "object" || Array.isArray(extra)) return {};
  const value = Reflect.get(extra, "round_remaining");
  // Backend owns remaining rounds. Preserve its field, including 0/leading zeros; never estimate from balance or fees.
  if (typeof value === "string") return { remaining: value };
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0)
    return { remaining: String(value) };
  return {};
}
export function createAutomationQueries(
  client: PublicClient | undefined,
  account: Address | undefined,
  enabled: boolean,
  blockNumber?: bigint,
) {
  const available = enabled && client?.chain?.id === 97 && !!account;
  const base = [
    "mine",
    "automation",
    97,
    protocol.address.toLowerCase(),
    account?.toLowerCase() ?? null,
  ] as const;
  async function guard(signal: AbortSignal) {
    if (!available || !client || !account)
      throw Error("Automation context unavailable");
    signal.throwIfAborted();
    if ((await client.getChainId()) !== 97)
      throw Error("Automation RPC mismatch");
    return { client, account };
  }
  return {
    // The block pins a fresh read of the same account resource, not a separate historical cache.
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    account: queryOptions({
      queryKey: [...base, "chain"] as const,
      enabled: available,
      staleTime: 30_000,
      retry: 1,
      refetchInterval: false as const,
      queryFn: async ({ signal }): Promise<Automation> => {
        const { client, account } = await guard(signal);
        const result = await client.readContract({
          ...protocol,
          functionName: "getAutomation",
          args: [account],
          blockNumber,
        });
        signal.throwIfAborted();
        if (
          result.active &&
          result.owner.toLowerCase() !== account.toLowerCase()
        )
          throw Error("Automation owner mismatch");
        return result;
      },
    }),
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    config: queryOptions({
      queryKey: [
        "mine",
        "automation",
        97,
        protocol.address.toLowerCase(),
        "config",
      ] as const,
      enabled: available,
      staleTime: 30_000,
      retry: 1,
      refetchInterval: false as const,
      queryFn: async ({ signal }) => {
        const { client } = await guard(signal);
        const result = await client.readContract({
          ...protocol,
          functionName: "config",
          blockNumber,
        });
        signal.throwIfAborted();
        return result[8];
      },
    }),
    // Chain state is authoritative; a null backend record must never replace active=true.
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    enrichment: queryOptions({
      queryKey: [...base, "enrichment"] as const,
      enabled: available,
      staleTime: 30_000,
      retry: 1,
      refetchInterval: false as const,
      queryFn: async ({ signal }) => {
        if (!available || !account)
          throw Error("Automation context unavailable");
        return automationEnrichment(
          await requestOriBackend({
            path: "/automation/user",
            form: { user: account },
            signal,
          }),
          account,
        );
      },
    }),
  };
}
