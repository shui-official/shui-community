import React, { useMemo } from "react";
import { useRouter } from "next/router";
import { useWallet } from "@solana/wallet-adapter-react";
import { useBeginnerMode } from "../contexts/BeginnerMode";
import { useSessionMe } from "../lib/security/useSessionMe";

type Step = {
  title: string;
  body: string;
  ctaLabel: string;
  cta: () => void;
};

export default function BeginnerNextStepFloating() {
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
        title: "Étape suivante : connecter le wallet",
        body:
          "Clique sur le bouton wallet en haut à droite (Phantom / Solflare).\n" +
          "Connexion wallet ≠ connexion sécurisée : ici tu fais juste apparaître ton adresse.\n" +
          "Aucune transaction n’est nécessaire pour se connecter au site.",
        ctaLabel: "Ouvrir le guide",
        cta: () => setGuideOpen(true),
      };
    }

    // 2) Wallet connecté mais session V2 non active
    if (!sessionOk) {
      return {
        title: "Étape suivante : activer la connexion sécurisée (V2)",
        body:
          "Tu es connecté au wallet. Maintenant active V2.\n" +
          "Tu vas signer un message lisible (signMessage) — PAS une transaction.\n" +
          "Si Phantom te propose une transaction ici : STOP.",
        ctaLabel: "Aller au login V2",
        cta: () => {
          if (pathname !== "/community") {
            router.push("/community#secure-login");
          } else {
            const el = document.getElementById("secure-login");
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
          openCoach(
            "Connexion sécurisée (V2)",
            "Objectif : créer une session serveur.\n" +
              "Tu signes un message lisible (gratuit) — pas de transaction.\n" +
              "Ensuite : ‘Session OK’ apparaît, et /dashboard devient accessible."
          );
        },
      };
    }

    // 3) Session OK → dashboard
    if (pathname !== "/dashboard") {
      return {
        title: "Étape suivante : aller au dashboard",
        body:
          "Session OK ✅\n" +
          "Le dashboard regroupe Quêtes / Rewards.\n" +
          "Tu peux y suivre tes points et ton statut mensuel.",
        ctaLabel: "Aller au dashboard",
        cta: () => router.push("/dashboard"),
      };
    }

    // 4) Dashboard → quêtes
    return {
      title: "Étape suivante : faire une quête",
      body:
        "Choisis une quête simple pour commencer.\n" +
        "V1 : claim off-chain (pas de transaction).\n" +
        "Plus tard : certaines preuves pourront être on-chain (swap/hold), mais pas le login.",
      ctaLabel: "Aller aux quêtes",
      cta: () => {
        const el = document.getElementById("quest-panel");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      },
    };
  }, [isBeginner, connected, wallet, sessionOk, pathname, router, openCoach, setGuideOpen]);

  // Anti-chevauchement (pro)
  if (!isBeginner || !step || guideOpen || coachOpen) return null;

  return (
    <div className="fixed bottom-[24px] left-5 z-[9998] w-[92vw] max-w-[360px]">
      <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-white shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur">
        <div className="text-xs text-white/60">Mode Débutant</div>
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
            Guide
          </button>
        </div>
      </div>
    </div>
  );
}
