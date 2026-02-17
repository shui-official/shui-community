import Head from "next/head";
import type { NextPage } from "next";
import { HomeView } from "../views/HomeView";

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>SHUI (水)</title>
        <meta name="description" content="SHUI (水) — Solana Community Token" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <HomeView />
    </>
  );
};

export default Home;
