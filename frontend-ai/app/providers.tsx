"use client";

import { type ReactNode, useEffect, useState } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { bscTestnet } from "viem/chains";
export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!mounted || !appId) {
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        defaultChain: bscTestnet,
        supportedChains: [bscTestnet],
        loginMethods: ["email"],
        appearance: {
          walletChainType: "ethereum-only",
          theme: "dark",
        },
        embeddedWallets: {
          ethereum: { createOnLogin: "all-users" },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}

