"use client";
import { useContext } from "react";
import { EvmTargetChainContext } from "../../src/shared/web3/evm/evm-target-chain-context";
import { ExplorePage } from "../../src/features/explore/explore-page";
import { ExploreReadPage } from "../../src/features/explore/explore-read-page";

export function ExploreRuntime() {
  const chain = useContext(EvmTargetChainContext);
  return chain?.id === 97 ? (
    <ExploreReadPage chainId={chain.id} />
  ) : (
    <ExplorePage />
  );
}
