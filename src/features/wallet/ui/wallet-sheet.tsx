"use client";

import { useId, useState } from "react";
import type { Address } from "viem";
import { Modal } from "../../../shared/ui/modal/modal";
import type { EvmChain } from "../../../shared/config/evm-chains";
import { useWalletCopy } from "../copy";
import {
  shortenWalletAddress,
  type WalletIdentity,
} from "../model/wallet-identity";
import { copyWalletAddress } from "../model/copy-wallet-address";
import styles from "./wallet-sheet.module.css";
import type { WalletBalance } from "../read/native-balance";

type Props = Readonly<{
  identity: WalletIdentity;
  balance?: WalletBalance;
  targetChain: EvmChain;
  actionFailed: boolean;
  onClose: () => void;
  onDisconnect: () => Promise<void>;
}>;

function Icon({ name, size }: Readonly<{ name: string; size: number }>) {
  // Exact, locally downloaded Figma vectors. Decorative inside labelled controls.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/ori/wallet/${name}.svg`} width={size} height={size} alt="" />
  );
}

function AddressRow({
  address,
  onDisconnect,
}: Readonly<{
  address: Address;
  onDisconnect: () => Promise<void>;
}>) {
  const text = useWalletCopy();
  const [feedback, setFeedback] = useState<"copied" | "copyFailed">();
  const [disconnecting, setDisconnecting] = useState(false);
  async function copyAddress() {
    setFeedback(
      await copyWalletAddress(address, (value) =>
        navigator.clipboard.writeText(value),
      ),
    );
  }

  async function disconnect() {
    setDisconnecting(true);
    try {
      await onDisconnect();
    } finally {
      setDisconnecting(false);
    }
  }
  return (
    <>
      <div className={styles.addressRow}>
        <Icon name="address-wallet" size={16} />
        <span className={styles.address} title={address}>
          {shortenWalletAddress(address)}
        </span>
        <button
          type="button"
          className={styles.copy}
          aria-label={text.copyAddress}
          onClick={copyAddress}
        >
          <Icon name="copy" size={14} />
        </button>
        <button
          type="button"
          className={styles.disconnect}
          aria-label={text.disconnect}
          disabled={disconnecting}
          aria-busy={disconnecting || undefined}
          onClick={disconnect}
        >
          <Icon name="disconnect" size={20} />
        </button>
      </div>
      {feedback && (
        <p
          className={styles.feedback}
          role={feedback === "copyFailed" ? "alert" : "status"}
        >
          {text[feedback]}
        </p>
      )}
    </>
  );
}

/** Wallet content and SDK-owned identity; shared Modal owns overlay behavior. */
export function WalletSheet({
  identity,
  balance = { status: "unavailable" },
  targetChain,
  actionFailed,
  onClose,
  onDisconnect,
}: Props) {
  const text = useWalletCopy();
  const balanceId = useId();

  const hasAddress = "address" in identity;
  const busy =
    identity.status === "loading" ||
    identity.status === "connecting" ||
    identity.status === "synchronizing";
  return (
    <Modal
      title={text.title}
      closeLabel={text.close}
      open={true}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <div className={styles.card}>
        <div className={styles.balanceRow}>
          <div className={styles.balance}>
            <p>{text.balance}</p>
            <div
              className={styles.amount}
              aria-describedby={balanceId}
              aria-busy={balance.status === "loading" || undefined}
              title={
                balance.status === "populated"
                  ? `${balance.exact} BNB`
                  : undefined
              }
            >
              {balance.status === "populated" ? balance.text : "—"} BNB
            </div>
          </div>
          {/* W1 exposes external-wallet identities only. Export/Receive belong to embedded wallets and stay absent here. */}
          <span id={balanceId} className={styles.srOnly}>
            {balance.status === "loading"
              ? text.balanceLoading
              : balance.status === "error"
                ? text.balanceFailed
                : balance.status === "populated"
                  ? `${balance.exact} BNB`
                  : text.balanceUnavailable}
          </span>
        </div>
        {hasAddress ? (
          <AddressRow
            key={`${identity.address}:${identity.walletChainId ?? "unknown"}`}
            address={identity.address}
            onDisconnect={onDisconnect}
          />
        ) : (
          <p
            className={styles.identityState}
            role="status"
            aria-busy={busy || undefined}
          >
            {busy ? text.loading : text.identityUnavailable}
          </p>
        )}
      </div>
      {identity.status === "chain-mismatch" ||
      identity.status === "chain-unknown" ? (
        <p className={styles.chainWarning} role="status">
          {identity.status === "chain-mismatch"
            ? text.wrongNetwork
            : text.networkUnknown}{" "}
          · {text.requiredNetwork}: {targetChain.name} ({targetChain.id})
        </p>
      ) : null}
      {actionFailed && (
        <p className={styles.chainWarning} role="alert">
          {text.actionFailed}
        </p>
      )}
    </Modal>
  );
}
