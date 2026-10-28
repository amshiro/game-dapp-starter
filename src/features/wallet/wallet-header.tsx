"use client";

import { useContext, useState, type ComponentProps } from "react";
import { useBalance } from "wagmi";
import {
  nativeBalanceAccount,
  nativeBalanceDisplay,
} from "./read/native-balance";
import { EvmTargetChainContext } from "../../shared/web3/evm/evm-target-chain-context";
import type { EvmChain } from "../../shared/config/evm-chains";
import { useWalletIdentity } from "./use-wallet-identity";
import { WalletHeaderView } from "./ui/wallet-header-view";
import { WalletSheet } from "./ui/wallet-sheet";

function RuntimeWalletSheet(
  props: Omit<ComponentProps<typeof WalletSheet>, "balance">,
) {
  const address = nativeBalanceAccount(props.identity, props.targetChain);
  // Native BNB uses eth_getBalance; no ERC20/ORE contract or Figma sample amount is involved.
  const balance = useBalance({
    address,
    chainId: props.targetChain.id,
    query: {
      enabled: address !== undefined,
      staleTime: 30_000,
      retry: 1,
      refetchOnMount: "always",
    },
  });
  return (
    <WalletSheet
      {...props}
      balance={nativeBalanceDisplay(balance, props.identity, props.targetChain)}
    />
  );
}

function ConfiguredWalletHeader({
  targetChain,
}: Readonly<{ targetChain: EvmChain }>) {
  const { identity, notice, connect, disconnect } = useWalletIdentity(
    targetChain.id,
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  return (
    <>
      <WalletHeaderView
        identity={identity}
        targetChain={targetChain}
        notice={notice}
        onConnect={connect}
        onOpenWallet={() => setSheetOpen(true)}
        walletOpen={sheetOpen}
      />
      {sheetOpen && (
        <RuntimeWalletSheet
          identity={identity}
          targetChain={targetChain}
          actionFailed={notice === "failed"}
          onClose={() => setSheetOpen(false)}
          onDisconnect={async () => {
            if (await disconnect()) setSheetOpen(false);
          }}
        />
      )}
    </>
  );
}

// Separate components guarantee no Privy/Wagmi hook executes without its Provider.
export function WalletHeader() {
  const targetChain = useContext(EvmTargetChainContext);
  return targetChain ? (
    <ConfiguredWalletHeader targetChain={targetChain} />
  ) : (
    <WalletHeaderView />
  );
}
