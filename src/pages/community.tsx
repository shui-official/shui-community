import type { GetStaticProps } from "next";
import Head from "next/head";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import CommunityView from "../views/CommunityView";

export default function CommunityPage() {
  const { t } = useTranslation("common");
  return (
    <>
      <Head>
        <title>{t("community.pageTitle")}</title>
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
