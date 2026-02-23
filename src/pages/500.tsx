import { serverSideTranslations } from "next-i18next/serverSideTranslations";
// pages/500.js
export default function Custom500() {
  return <h1>500 - Server-side error occurred</h1>;
}


export async function getStaticProps({ locale }: { locale?: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "fr", ["common"])),
    },
  };
}
