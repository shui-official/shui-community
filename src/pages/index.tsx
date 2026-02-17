import Head from "next/head";
import type { NextPage } from "next";
import { HomeView } from "../views/HomeView";

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>SHUI (水)</title>
        <meta name="description" content="SHUI (水) — Solana Community Token" />

        {/* Favicon (logo dans l'onglet) */}
        {/* Option 1 (recommandée): favicon.ico */}
        {/* Mets un fichier /public/favicon.ico */}
        <link rel="icon" href="/favicon.ico" />

        {/* Option 2 (si tu n'as pas de .ico): utilise ton PNG */}
        {/* Mets ton logo dans /public/shui-token.png puis décommente la ligne ci-dessous */}
        {/* <link rel="icon" href="/shui-token.png?v=2" /> */}
      </Head>

      <HomeView />
    </>
  );
};

export default Home;
