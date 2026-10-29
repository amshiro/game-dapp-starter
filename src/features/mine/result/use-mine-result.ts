"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { getContractsForChain } from "../../../shared/config/evm-contracts";
import type { MineBoardSnapshot } from "../read/mine-read-query";
import { MineResultAnimation, resultKey } from "./mine-result";
const c = getContractsForChain(97);
const scope = `97:${c.oreProtocol.address.toLowerCase()}:${c.oreProtocolView.address.toLowerCase()}`;
export function useMineResult(snapshot: MineBoardSnapshot | undefined) {
  const [animation] = useState(() => new MineResultAnimation());
  const frame = useSyncExternalStore(
    animation.subscribe,
    animation.getSnapshot,
    animation.getSnapshot,
  );
  const roundId = snapshot?.roundId;
  const winner = snapshot?.randomnessFulfilled
    ? snapshot.winningSquare
    : undefined;
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const observe = () => {
      animation.observe(
        roundId === undefined ? undefined : { scope, roundId, winner },
        motion.matches || document.hidden,
      );
    };
    const visibility = () => {
      if (document.hidden) animation.suspend();
      else observe();
    };
    observe();
    motion.addEventListener("change", observe);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      motion.removeEventListener("change", observe);
      document.removeEventListener("visibilitychange", visibility);
      animation.suspend();
    };
  }, [animation, roundId, winner]);
  // Errors/wrong-chain/new round hide old result synchronously, before effects can cancel its clock.
  const key = roundId === undefined ? undefined : resultKey({ scope, roundId });
  return key !== undefined && frame.key === key && winner !== undefined
    ? frame
    : undefined;
}
