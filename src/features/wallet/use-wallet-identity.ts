"use client";

import { useState } from "react";
import {
  useConnectWallet,
  useLogin,
  useLogout,
  usePrivy,
  useWallets,
} from "@privy-io/react-auth";
import { useConnection } from "wagmi";
import {
  connectionNotice,
  type ConnectionNotice,
} from "./model/connection-notice";
import { deriveWalletIdentity } from "./model/wallet-identity";

/** Mounted only inside the configured Runtime boundary. No SDK identity is copied. */
export function useWalletIdentity(targetChainId: number) {
  const { ready, authenticated, isModalOpen } = usePrivy();
  const { ready: walletsReady, wallets } = useWallets();
  const connection = useConnection();
  const [notice, setNotice] = useState<ConnectionNotice>();
  const onError = (error: unknown) => setNotice(connectionNotice(error));
  const { login } = useLogin({
    onComplete: () => setNotice(undefined),
    onError,
  });
  const { connectWallet } = useConnectWallet({
    onSuccess: () => setNotice(undefined),
    onError,
  });
  const { logout } = useLogout();
  const identity = deriveWalletIdentity({
    privyReady: ready,
    walletsReady,
    authenticated,
    modalOpen: isModalOpen,
    connectionStatus: connection.status,
    address: connection.address,
    chainId: connection.chainId,
    wallets,
    targetChainId,
  });

  function connect() {
    if (
      identity.status !== "unauthenticated" &&
      identity.status !== "wallet-missing"
    )
      return;
    setNotice(undefined);
    try {
      if (authenticated) connectWallet({ walletChainType: "ethereum-only" });
      else
        login({ loginMethods: ["wallet"], walletChainType: "ethereum-only" });
    } catch (error) {
      onError(error);
    }
  }

  // W1 exposes the SDK operation for isolated verification; W2 owns its product UI.
  async function disconnect() {
    try {
      await logout();
      setNotice(undefined);
    } catch (error) {
      onError(error);
    }
  }

  return { identity, notice, connect, disconnect };
}
