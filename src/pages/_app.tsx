import "@solana/wallet-adapter-react-ui/styles.css";
import React from "react";
import type { AppProps } from "next/app";
import dynamic from "next/dynamic";
import { ConnectionProvider } from "@solana/wallet-adapter-react";

import "tailwindcss/tailwind.css";
import "../styles/globals.css";
import "../styles/App.css";

// RPC endpoint (mainnet). You can replace later with your own paid RPC for better reliability.
const endpoint = "https://ssc-dao.genesysgo.net";

const WalletProvider = dynamic(() => import("../contexts/ClientWalletProvider"), {
  ssr: false,
});

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider>
        <Component {...pageProps} />
      </WalletProvider>
    </ConnectionProvider>
  );
}
