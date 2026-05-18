import type { GetStaticProps } from "next";
import Head from "next/head";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import CommunityView from "../views/CommunityView";

// ── Meta constants ──────────────────────────────────────
const META_TITLE = "SHUI Community — Espace membres, quetes et recompenses Solana";
const META_DESC =
  "Connectez votre wallet Solana et acceadez a l'espace membres SHUI : " +
  "quetes communautaires, systeme de recompenses et gouvernance participative.";
const META_URL = "https://shui-community.vercel.app/community";
const META_IMAGE = "https://shui-community.vercel.app/og-image.png";

export default function CommunityPage() {
  const { t } = useTranslation("common");
  return (
    <>
      <Head>
        {/* ── Title ── */}
        <title>{t("community.pageTitle", { defaultValue: META_TITLE })}</title>

        {/* ── SEO ── */}
        <meta name="description" content={META_DESC} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={META_URL} />

        {/* ── Open Graph ── */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={META_URL} />
        <meta property="og:title" content={META_TITLE} />
        <meta property="og:description" content={META_DESC} />
        <meta property="og:image" content={META_IMAGE} />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:site_name" content="SHUI Community" />

        {/* ── Twitter / X Card ── */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={META_TITLE} />
        <meta name="twitter:description" content={META_DESC} />
        <meta name="twitter:image" content={META_IMAGE} />
      </Head>
      <CommunityView />
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "fr", ["common"]))
    }
  };
};
