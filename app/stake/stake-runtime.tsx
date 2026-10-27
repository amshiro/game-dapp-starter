"use client";

import { useContext } from "react";
import { EvmTargetChainContext } from "../../src/shared/web3/evm/evm-target-chain-context";
import { useWalletIdentity } from "../../src/features/wallet/use-wallet-identity";
import { StakePage } from "../../src/features/stake/stake-page";
import { StakeReadPage } from "../../src/features/stake/stake-read-page";
import { stakeAccount } from "./stake-account";

function DevelopmentStake() {
  const target = useContext(EvmTargetChainContext)!;
  // Route composition reuses W1 facts; Stake never imports Wallet internals or mirrors SDK state.
  const { identity } = useWalletIdentity(target.id);
  return (
    <StakeReadPage
      context={{ targetChainId: target.id, account: stakeAccount(identity) }}
    />
  );
}
export function StakeRuntime() {
  const target = useContext(EvmTargetChainContext);
  // No unmounted SDK hooks, production RPC fallback or unverified 56 reads.
  return target?.id === 97 ? <DevelopmentStake /> : <StakePage />;
}
