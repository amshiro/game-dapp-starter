"use client";

import { useContext } from "react";
import { EvmTargetChainContext } from "../../shared/web3/evm/evm-target-chain-context";
import type { EvmChain } from "../../shared/config/evm-chains";
import { useWalletIdentity } from "./use-wallet-identity";
import { WalletHeaderView } from "./ui/wallet-header-view";

function ConfiguredWalletHeader({
  targetChain,
}: Readonly<{ targetChain: EvmChain }>) {
  const { identity, notice, connect } = useWalletIdentity(targetChain.id);
  return (
    <WalletHeaderView
      identity={identity}
      targetChain={targetChain}
      notice={notice}
      onConnect={connect}
    />
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
