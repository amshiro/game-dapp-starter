"use client";

import { createContext } from "react";
import type { EvmChain } from "../../config/evm-chains";

// Runtime configuration only. Wallet/account/authentication facts remain SDK-owned.
// Undefined also means Privy/Wagmi hooks must not be mounted below this boundary.
export const EvmTargetChainContext = createContext<EvmChain | undefined>(
  undefined,
);
