import React, { useMemo } from "react";
import { useRouter } from "next/router";
import { useWallet } from "@solana/wallet-adapter-react";
import { useBeginnerMode } from "../contexts/BeginnerMode";
import { useSessionMe } from "../lib/security/useSessionMe";
import { useTranslation } from "next-i18next";

type Step = {
  title: string;
  body: string;
  ctaLabel: string;
  cta: () => void;
};

export default function BeginnerNextStepFloating() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const pathname = router.pathname;

  const { connected, publicKey } = useWallet();
  const { isBeginner, openCoach, setGuideOpen, guideOpen, coachOpen } = useBeginnerMode();

  const wallet = useMemo(() => publicKey?.toBase58() || "", [publicKey]);

  // ✅ 1 seul poll partagé
  const me = useSessionMe(isBeginner);
  const sessionOk = useMemo(() => Boolean(me?.ok && me?.wallet && wallet && me.wallet === wallet), [me, wallet]);

  const step: Step | null = useMemo(() => {
    if (!isBeginner) return null;

    // 1) Wallet non connecté
    if (!connected || !wallet) {
      return {
        title: t("beginner.floating.step1.title"),
        body: t("beginner.floating.step1.body"),
        ctaLabel: t("beginner.floating.step1.ctaLabel"),
        cta: () => setGuideOpen(true),
      };
    }

    // 2) Wallet connecté mais session V2 non active
    if (!sessionOk) {
      return {
        title: t("beginner.floating.step2.title"),
        body: t("beginner.floating.step2.body"),
        ctaLabel: t("beginner.floating.step2.ctaLabel"),
        cta: () => {
          if (pathname !== "/community") {
            router.push("/community#secure-login");
          } else {
            const el = document.getElementById("secure-login");
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
          openCoach(t("beginner.floating.step2.coachTitle"), t("beginner.floating.step2.coachText"));
        },
      };
    }

    // 3) Session OK → dashboard
    if (pathname !== "/dashboard") {
      return {
        title: t("beginner.floating.step3.title"),
        body: t("beginner.floating.step3.body"),
        ctaLabel: t("beginner.floating.step3.ctaLabel"),
        cta: () => router.push("/dashboard"),
      };
    }

    // 4) Dashboard → quêtes
    return {
      title: t("beginner.floating.step4.title"),
      body: t("beginner.floating.step4.body"),
      ctaLabel: t("beginner.floating.step4.ctaLabel"),
      cta: () => {
        const el = document.getElementById("quest-panel");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      },
    };
  }, [isBeginner, connected, wallet, sessionOk, pathname, router, openCoach, setGuideOpen, t]);

  // Anti-chevauchement (pro)
  if (!isBeginner || !step || guideOpen || coachOpen) return null;

  return (
    <div className="fixed bottom-[24px] left-5 z-[9998] w-[92vw] max-w-[360px]">
      <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-white shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur">
        <div className="text-xs text-white/60">{t("beginner.floating.label")}</div>
        <div className="mt-1 text-sm font-semibold text-white">{step.title}</div>
        <div className="mt-2 text-xs text-white/80 whitespace-pre-line">{step.body}</div>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={step.cta}
            className="rounded-xl bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/25"
          >
            {step.ctaLabel}
          </button>

          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10"
          >
            {t("beginner.floating.guide")}
          </button>
        </div>
      </div>
    </div>
  );
}
