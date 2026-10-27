"use client";

import { useState, type ReactNode } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClientProvider } from "@tanstack/react-query";
import { resolveEvmCapability } from "@/src/shared/config/evm-capability";
import { readPublicConfig } from "@/src/shared/config/public-config";
import { resolveRealtimeCapability } from "@/src/shared/config/realtime-capability";
import { getQueryClient } from "@/src/shared/query/query-client";
import { RealtimeProvider } from "@/src/shared/realtime/realtime-provider";
import { createEvmRuntime } from "@/src/shared/web3/evm/evm-runtime";

function createConfiguredEvmRuntime() {
  const capability = resolveEvmCapability(readPublicConfig);
  return capability.status === "configured"
    ? createEvmRuntime(capability)
    : undefined;
}

export default function Providers({
  children,
}: Readonly<{ children: ReactNode }>) {
  const queryClient = getQueryClient();
  // One runtime per provider tree: per request on the Server, stable in the browser.
  const [evmRuntime] = useState(createConfiguredEvmRuntime);
  const [realtimeCapability] = useState(() =>
    resolveRealtimeCapability(readPublicConfig),
  );

  // Realtime only signals freshness into the Query cache; it does not depend on Web3.
  const content = (
    <RealtimeProvider capability={realtimeCapability}>
      {children}
    </RealtimeProvider>
  );

  // Without a complete, coherent EVM config the app runs with Web3 disabled.
  if (evmRuntime === undefined) {
    return (
      <QueryClientProvider client={queryClient}>{content}</QueryClientProvider>
    );
  }

  // Privy's documented order: PrivyProvider → QueryClientProvider → WagmiProvider.
  return (
    <PrivyProvider
      appId={evmRuntime.privyAppId}
      config={evmRuntime.privyConfig}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={evmRuntime.wagmiConfig}>{content}</WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
