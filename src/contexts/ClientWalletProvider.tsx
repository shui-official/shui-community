import React, { useMemo } from "react";
import { WalletProvider, WalletProviderProps } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";

import "@solana/wallet-adapter-react-ui/styles.css";

export function ClientWalletProvider(
  props: Omit<WalletProviderProps, "wallets">
): JSX.Element {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <WalletProvider wallets={wallets} {...props}>
      <WalletModalProvider />
      {props.children}
    </WalletProvider>
  );
}

export default ClientWalletProvider;
