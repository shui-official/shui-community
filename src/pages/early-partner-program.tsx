import type { GetServerSideProps } from "next";

const MAP: Record<string, string> = {
  fr: "/early-partner-sandbox/index-fr.html",
  en: "/early-partner-sandbox/index-en.html",
  de: "/early-partner-sandbox/index-de.html",
  es: "/early-partner-sandbox/index-es.html",
  it: "/early-partner-sandbox/index-it.html",
  ru: "/early-partner-sandbox/index-ru.html",
  zh: "/early-partner-sandbox/index-zh.html",
};

export default function EarlyPartnerProgramRedirect() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const detected =
    locale ||
    (typeof req.headers["accept-language"] === "string"
      ? req.headers["accept-language"].split(",")[0].split("-")[0]
      : "en");

  const destination = MAP[detected] || MAP.en;

  return {
    redirect: {
      destination,
      permanent: false,
    },
  };
};
