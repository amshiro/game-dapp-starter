import type { EvmChain } from "../../../shared/config/evm-chains";
import type { ConnectionNotice } from "../model/connection-notice";
import {
  shortenWalletAddress,
  type WalletIdentity,
} from "../model/wallet-identity";
import styles from "./wallet-header.module.css";

type Props = Readonly<{
  identity?: WalletIdentity;
  targetChain?: EvmChain;
  notice?: ConnectionNotice;
  onConnect?: () => void;
}>;

export function WalletHeaderView({
  identity,
  targetChain,
  notice,
  onConnect,
}: Props) {
  if (identity && "address" in identity && targetChain) {
    const detail =
      identity.status === "chain-mismatch"
        ? "Wrong network"
        : identity.status === "chain-unknown"
          ? "Network unknown"
          : undefined;
    const description = detail
      ? `${detail}. Wallet chain ${identity.walletChainId ?? "unknown"}. Required ${targetChain.name} (${targetChain.id}).`
      : `Connected to ${targetChain.name} (${targetChain.id}).`;
    return (
      <div className={styles.control}>
        <div
          className={`${styles.identity} ${detail ? styles.warning : ""}`}
          role="status"
          aria-label={`Wallet ${identity.address}. ${description}`}
          title={`${identity.address}. ${description}`}
        >
          {/* Exact 14×14 asset from Header wallet node 2003:1003. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/ori/wallet/header-wallet.svg"
            width={14}
            height={14}
            alt=""
          />
          <span>{shortenWalletAddress(identity.address)}</span>
        </div>
        {detail && <span className={styles.detail}>{detail}</span>}
      </div>
    );
  }
  const status = identity?.status;
  const canConnect =
    status === "unauthenticated" || status === "wallet-missing";
  const busy =
    status === "loading" ||
    status === "connecting" ||
    status === "synchronizing";
  const label =
    status === "connecting"
      ? "Connecting…"
      : busy
        ? "Loading…"
        : status === "wallet-missing"
          ? "Reconnect"
          : "Connect";
  const detail =
    status === "unsupported-wallet"
      ? "External wallet required"
      : notice === "cancelled"
        ? "Connection cancelled"
        : notice === "failed"
          ? "Connection failed"
          : undefined;
  return (
    <div className={styles.control}>
      <button
        type="button"
        className={`${styles.connect} ${status === "connecting" ? styles.connecting : ""}`}
        disabled={!canConnect}
        aria-busy={busy || undefined}
        aria-label={!identity ? "Wallet connection unavailable" : label}
        onClick={canConnect ? onConnect : undefined}
      >
        {label}
      </button>
      {detail && (
        <span
          className={`${styles.detail} ${notice === "cancelled" ? styles.neutralDetail : ""}`}
          role={notice === "failed" ? "alert" : "status"}
        >
          {detail}
        </span>
      )}
    </div>
  );
}
