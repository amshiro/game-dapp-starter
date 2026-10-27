"use client";

import { useContext, useState } from "react";
import { EvmTargetChainContext } from "../../shared/web3/evm/evm-target-chain-context";
import type { EvmChain } from "../../shared/config/evm-chains";
import { useWalletIdentity } from "./use-wallet-identity";
import { WalletHeaderView } from "./ui/wallet-header-view";
import { WalletSheet } from "./ui/wallet-sheet";

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
        <WalletSheet
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
