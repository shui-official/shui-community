/** @type {import('next-i18next').UserConfig} */
module.exports = {
  i18n: {
    defaultLocale: "fr",
    locales: ["fr", "en", "es", "it", "de", "ru", "zh"],
  },
  reloadOnPrerender: process.env.NODE_ENV !== "production",
};
