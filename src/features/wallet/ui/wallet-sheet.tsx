"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Address } from "viem";
import type { EvmChain } from "../../../shared/config/evm-chains";
import { resolveLocale } from "../../../shared/i18n/locale";
import {
  shortenWalletAddress,
  type WalletIdentity,
} from "../model/wallet-identity";
import copy from "../locales/en.json";
import { copyWalletAddress } from "../model/copy-wallet-address";
import styles from "./wallet-sheet.module.css";

type Props = Readonly<{
  identity: WalletIdentity;
  targetChain: EvmChain;
  actionFailed: boolean;
  onClose: () => void;
  onDisconnect: () => Promise<void>;
}>;

// The only supported locale is resolved centrally. No locale or SDK state mirror.
const resources = { en: copy };

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
  const text = resources[resolveLocale()];
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

/** Wallet-local modal behavior; native top-layer focus isolation, ESC and restoration. */
export function WalletSheet({
  identity,
  targetChain,
  actionFailed,
  onClose,
  onDisconnect,
}: Props) {
  const text = resources[resolveLocale()];
  const dialog = useRef<HTMLDialogElement>(null);
  const backdropPress = useRef(false);
  const titleId = useId();
  const balanceId = useId();
  const exportId = useId();
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    node.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      node.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus({ preventScroll: true });
    };
  }, []);

  const hasAddress = "address" in identity;
  const busy =
    identity.status === "loading" ||
    identity.status === "connecting" ||
    identity.status === "synchronizing";
  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onPointerDown={(event) => {
        backdropPress.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (!backdropPress.current || event.target !== event.currentTarget)
          return;
        const bounds = event.currentTarget.getBoundingClientRect();
        // Transparent native backdrop outside the ORI viewport is not a close target.
        if (
          event.clientX >= bounds.left &&
          event.clientX <= bounds.right &&
          event.clientY >= bounds.top &&
          event.clientY <= bounds.bottom
        )
          onClose();
      }}
    >
      <section className={styles.sheet}>
        <div className={styles.titleRow}>
          <h2 id={titleId}>{text.title}</h2>
          <button
            type="button"
            className={styles.close}
            aria-label={text.close}
            onClick={onClose}
          >
            <Icon name="close" size={24} />
          </button>
        </div>
        <div className={styles.card}>
          <div className={styles.balanceRow}>
            <div className={styles.balance}>
              <p>{text.balance}</p>
              <div className={styles.amount} aria-describedby={balanceId}>
                — ORE
              </div>
            </div>
            {/* Keep the Figma Export slot. No guessed action, SDK export or Receive. */}
            <button
              type="button"
              className={styles.export}
              aria-disabled="true"
              aria-describedby={exportId}
              title={text.exportUnavailable}
            >
              {text.export}
            </button>
            <span id={exportId} className={styles.srOnly}>
              {text.exportUnavailable}
            </span>
            <span id={balanceId} className={styles.srOnly}>
              {text.balanceUnavailable}
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
      </section>
    </dialog>
  );
}
