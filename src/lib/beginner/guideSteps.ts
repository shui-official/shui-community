import type { TFunction } from "i18next";

export type GuideStep = {
  id: string;
  title: string;
  pageHint?: string; // ex: "/community"
  bullets: string[];
  warning?: string;
  cta?: { label: string; href?: string };
};

export function buildGuideSteps(t: TFunction): GuideStep[] {
  return [
    {
      id: "safety",
      title: t("beginner.guide.steps.safety.title"),
      bullets: [
        t("beginner.guide.steps.safety.b1"),
        t("beginner.guide.steps.safety.b2"),
        t("beginner.guide.steps.safety.b3"),
        t("beginner.guide.steps.safety.b4"),
      ],
      warning: t("beginner.guide.steps.safety.warning"),
    },
    {
      id: "wallet",
      title: t("beginner.guide.steps.wallet.title"),
      bullets: [
        t("beginner.guide.steps.wallet.b1"),
        t("beginner.guide.steps.wallet.b2"),
        t("beginner.guide.steps.wallet.b3"),
        t("beginner.guide.steps.wallet.b4"),
      ],
      warning: t("beginner.guide.steps.wallet.warning"),
    },
    {
      id: "connect",
      title: t("beginner.guide.steps.connect.title"),
      pageHint: "/community",
      bullets: [
        t("beginner.guide.steps.connect.b1"),
        t("beginner.guide.steps.connect.b2"),
        t("beginner.guide.steps.connect.b3"),
      ],
    },
    {
      id: "secure-login",
      title: t("beginner.guide.steps.secureLogin.title"),
      pageHint: "/community",
      bullets: [
        t("beginner.guide.steps.secureLogin.b1"),
        t("beginner.guide.steps.secureLogin.b2"),
        t("beginner.guide.steps.secureLogin.b3"),
        t("beginner.guide.steps.secureLogin.b4"),
      ],
      warning: t("beginner.guide.steps.secureLogin.warning"),
    },
    {
      id: "buy",
      title: t("beginner.guide.steps.buy.title"),
      pageHint: "/community",
      bullets: [
        t("beginner.guide.steps.buy.b1"),
        t("beginner.guide.steps.buy.b2"),
        t("beginner.guide.steps.buy.b3"),
        t("beginner.guide.steps.buy.b4"),
      ],
      cta: { label: t("beginner.guide.steps.buy.ctaLabel"), href: "https://jup.ag/" },
    },
    {
      id: "lp",
      title: t("beginner.guide.steps.lp.title"),
      pageHint: "/community",
      bullets: [
        t("beginner.guide.steps.lp.b1"),
        t("beginner.guide.steps.lp.b2"),
        t("beginner.guide.steps.lp.b3"),
        t("beginner.guide.steps.lp.b4"),
      ],
      warning: t("beginner.guide.steps.lp.warning"),
    },
    {
      id: "dashboard",
      title: t("beginner.guide.steps.dashboard.title"),
      pageHint: "/dashboard",
      bullets: [
        t("beginner.guide.steps.dashboard.b1"),
        t("beginner.guide.steps.dashboard.b2"),
        t("beginner.guide.steps.dashboard.b3"),
      ],
    },
    {
      id: "next",
      title: t("beginner.guide.steps.next.title"),
      bullets: [
        t("beginner.guide.steps.next.b1"),
        t("beginner.guide.steps.next.b2"),
        t("beginner.guide.steps.next.b3"),
      ],
    },
  ];
}

export function buildGlossary(t: TFunction): { k: string; v: string }[] {
  return [
    { k: t("beginner.guide.glossary.wallet.k"), v: t("beginner.guide.glossary.wallet.v") },
    { k: t("beginner.guide.glossary.seed.k"), v: t("beginner.guide.glossary.seed.v") },
    { k: t("beginner.guide.glossary.mint.k"), v: t("beginner.guide.glossary.mint.v") },
    { k: t("beginner.guide.glossary.swap.k"), v: t("beginner.guide.glossary.swap.v") },
    { k: t("beginner.guide.glossary.lp.k"), v: t("beginner.guide.glossary.lp.v") },
    { k: t("beginner.guide.glossary.tx.k"), v: t("beginner.guide.glossary.tx.v") },
    { k: t("beginner.guide.glossary.msgsig.k"), v: t("beginner.guide.glossary.msgsig.v") }
  ];
}
