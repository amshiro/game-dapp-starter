"use client";
import { useContext } from "react";
import { EvmTargetChainContext } from "../../src/shared/web3/evm/evm-target-chain-context";
import { useWalletIdentity } from "../../src/features/wallet/use-wallet-identity";
import { useLocale } from "../../src/shared/i18n/locale-provider";
import { PointsPage } from "../../src/features/points/points-page";
import { PointsReadPage } from "../../src/features/points/points-read-page";
function DevelopmentPoints() {
  const target = useContext(EvmTargetChainContext)!;
  const { identity } = useWalletIdentity(target.id);
  return (
    <PointsReadPage
      chainId={target.id}
      accountLoading={["loading", "connecting", "synchronizing"].includes(
        identity.status,
      )}
      account={identity.status === "connected" ? identity.address : undefined}
    />
  );
}
export function PointsRuntime() {
  const target = useContext(EvmTargetChainContext);
  const locale = useLocale();
  return target?.id === 97 ? (
    <DevelopmentPoints />
  ) : (
    <PointsPage locale={locale} />
  );
}
