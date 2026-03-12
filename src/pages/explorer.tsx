import type { GetStaticProps } from "next";
import Head from "next/head";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import { ExplorerView } from "../views/ExplorerView";

export default function ExplorerPage() {
  const { t } = useTranslation("common");

  return (
    <>
      <Head>
        <title>{t("explorer.meta.title")}</title>
        <meta
          name="description"
          content={t("explorer.meta.description")}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content={t("explorer.meta.ogTitle")} />
        <meta property="og:description" content={t("explorer.meta.ogDescription")} />
      </Head>
      <ExplorerView />
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
