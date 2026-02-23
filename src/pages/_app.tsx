import "@solana/wallet-adapter-react-ui/styles.css";
import type { AppProps } from "next/app";
import Head from "next/head";

import dynamic from "next/dynamic";
import { ConnectionProvider } from "@solana/wallet-adapter-react";

import "tailwindcss/tailwind.css";
import "../styles/globals.css";
import "../styles/App.css";

import { BeginnerModeProvider } from "../contexts/BeginnerMode";
import BeginnerModeToggle from "../components/BeginnerModeToggle";
import BeginnerCoachPanel from "../components/BeginnerCoachPanel";
import BeginnerNextStepFloating from "../components/BeginnerNextStepFloating";
import WalletSessionBridge from "../components/WalletSessionBridge";

const endpoint = "https://ssc-dao.genesysgo.net";

const WalletProvider = dynamic(() => import("../contexts/ClientWalletProvider"), { ssr: false });

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>SHUI (水)</title>
        <meta name="theme-color" content="#0b1220" />
        <link rel="icon" type="image/png" href="/shui-token.png" />
        <link rel="apple-touch-icon" href="/shui-token.png" />
      </Head>

      <BeginnerModeProvider>
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider>
            {/* ✅ Tout ce qui utilise useWallet() doit être ici */}
            <WalletSessionBridge />

            <BeginnerModeToggle />
            <BeginnerCoachPanel />
            <BeginnerNextStepFloating />

            <Component {...pageProps} />
          </WalletProvider>
        </ConnectionProvider>
      </BeginnerModeProvider>
    </>
  );
}
