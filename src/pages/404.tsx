import { serverSideTranslations } from "next-i18next/serverSideTranslations";
// pages/404.js
export default function Custom404() {
  return <h1>404 - Page Not Found</h1>;
}


export async function getStaticProps({ locale }: { locale?: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "fr", ["common"])),
    },
  };
}
