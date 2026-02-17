import "@solana/wallet-adapter-react-ui/styles.css";
import type { AppProps } from "next/app";
import Head from "next/head";

import dynamic from "next/dynamic";
import { ConnectionProvider } from "@solana/wallet-adapter-react";

import "tailwindcss/tailwind.css";
import "../styles/globals.css";
import "../styles/App.css";

// set custom RPC server endpoint for the final website
// const endpoint = "https://explorer-api.devnet.solana.com";
// const endpoint = "http://127.0.0.1:8899";
const endpoint = "https://ssc-dao.genesysgo.net";

const WalletProvider = dynamic(
  () => import("../contexts/ClientWalletProvider"),
  { ssr: false }
);

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        {/* Title (onglet) */}
        <title>SHUI (水)</title>

        {/* Couleur “pro” sur mobile / onglet (Chrome/Android, etc.) */}
        <meta name="theme-color" content="#0b1220" />

        {/* Favicons (onglet) */}
        <link rel="icon" type="image/png" href="/shui-token.png" />
        <link rel="apple-touch-icon" href="/shui-token.png" />
      </Head>

      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider>
          <Component {...pageProps} />
        </WalletProvider>
      </ConnectionProvider>
    </>
  );
}
