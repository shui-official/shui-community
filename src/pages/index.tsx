import type { GetStaticProps } from "next";
import Head from "next/head";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { HomeView } from "../views/HomeView";

export default function HomePage() {
  return (
    <>
      <Head>
        <title>SHUI — Accueil</title>
      </Head>
      <HomeView />
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "fr", ["common"])),
    },
  };
};
