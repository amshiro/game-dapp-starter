"use client";
import { useContext } from "react";
import { EvmTargetChainContext } from "../../src/shared/web3/evm/evm-target-chain-context";
import { useWalletIdentity } from "../../src/features/wallet/use-wallet-identity";
import { MinePage } from "../../src/features/mine/mine-page";
import { MineReadPage } from "../../src/features/mine/mine-read-page";

function DevelopmentMine() {
  const target = useContext(EvmTargetChainContext)!;
  // W1 projects mismatch facts only; no account/address enters the public round Query key.
  const { identity } = useWalletIdentity(target.id);
  return (
    <MineReadPage
      context={{
        targetChainId: target.id,
        wrongChain:
          identity.status === "chain-mismatch" ||
          identity.status === "chain-unknown",
      }}
    />
  );
}
export function MineRuntime() {
  const target = useContext(EvmTargetChainContext);
  return target?.id === 97 ? <DevelopmentMine /> : <MinePage />;
}
