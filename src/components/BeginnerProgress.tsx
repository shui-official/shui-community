import React, { useMemo } from "react";
import { useRouter } from "next/router";
import { useWallet } from "@solana/wallet-adapter-react";
import { useBeginnerMode } from "../contexts/BeginnerMode";
import { useSessionMe } from "../lib/security/useSessionMe";

function StepRow({
  done,
  title,
  subtitle,
  action,
}: {
  done: boolean;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={[
              "inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold",
              done ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-200" : "border-white/15 bg-white/5 text-white/70",
            ].join(" ")}
          >
            {done ? "✓" : "•"}
          </span>
          <div className="text-sm font-semibold text-white/90">{title}</div>
        </div>
        <div className="mt-1 text-xs text-white/65">{subtitle}</div>
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export default function BeginnerProgress() {
  const router = useRouter();
  const { connected, publicKey } = useWallet();
  const {
    isBeginner,
    setGuideOpen,
    openCoach,
    didInstallWallet,
    setDidInstallWallet,
    didFirstTest,
    setDidFirstTest,
    resetProgress,
  } = useBeginnerMode();

  const wallet = useMemo(() => publicKey?.toBase58() || "", [publicKey]);

  // ✅ 1 seul poll partagé
  const me = useSessionMe(isBeginner);
  const sessionOk = useMemo(() => Boolean(me?.ok && me?.wallet && wallet && me.wallet === wallet), [me, wallet]);

  const step1 = didInstallWallet;
  const step2 = connected && !!wallet;
  const step3 = sessionOk;
  const step4 = didFirstTest;

  const doneCount = [step1, step2, step3, step4].filter(Boolean).length;

  if (!isBeginner) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-white/90">Parcours débutant</div>
          <div className="mt-1 text-xs text-white/60">4 étapes simples • objectif : éviter les erreurs</div>
        </div>

        <button
          type="button"
          onClick={resetProgress}
          className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10"
          title="Remettre à zéro"
        >
          Reset
        </button>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] text-white/55">
          <span>Progress</span>
          <span>{doneCount}/4</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full border border-white/10 bg-black/30">
          <div className="h-full bg-emerald-400/30" style={{ width: `${(doneCount / 4) * 100}%` }} />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <StepRow
          done={step1}
          title="1) Installer Phantom"
          subtitle="Extension navigateur. Sauvegarde ta seed hors-ligne."
          action={
            <button
              type="button"
              onClick={() => {
                setDidInstallWallet(!didInstallWallet);
                if (!didInstallWallet) {
                  openCoach(
                    "Installer Phantom (rappel sécurité)",
                    "Ne partage jamais ta seed phrase.\nÉvite les liens inconnus.\nQuand tu es prêt : connecte le wallet sur le site (étape 2)."
                  );
                }
              }}
              className={[
                "rounded-lg border px-3 py-2 text-xs font-semibold",
                step1 ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-200" : "border-white/15 bg-white/10 text-white/80 hover:bg-white/15",
              ].join(" ")}
            >
              {step1 ? "OK" : "Marquer OK"}
            </button>
          }
        />

        <StepRow
          done={step2}
          title="2) Connecter le wallet"
          subtitle="Clique sur le bouton wallet (en haut). Connexion wallet ≠ transaction."
          action={
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/15"
            >
              Guide
            </button>
          }
        />

        <StepRow
          done={step3}
          title="3) Activer la connexion sécurisée (V2)"
          subtitle="Signature d’un message (gratuit) → Session OK → accès Dashboard."
          action={
            <button
              type="button"
              onClick={() => {
                router.push("/community#secure-login");
                openCoach(
                  "Connexion sécurisée (V2)",
                  "Tu signes un message lisible (gratuit).\nAucune transaction.\nSi Phantom te propose une transaction ici : STOP."
                );
              }}
              className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/15"
            >
              Aller
            </button>
          }
        />

        <StepRow
          done={step4}
          title="4) Premier test (petit montant)"
          subtitle="Swap SOL→SHUI ou LP : transaction normale. Commence petit."
          action={
            <button
              type="button"
              onClick={() => setDidFirstTest(!didFirstTest)}
              className={[
                "rounded-lg border px-3 py-2 text-xs font-semibold",
                step4 ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-200" : "border-white/15 bg-white/10 text-white/80 hover:bg-white/15",
              ].join(" ")}
            >
              {step4 ? "OK" : "Marquer OK"}
            </button>
          }
        />
      </div>

      <div className="mt-4 text-[11px] text-white/50">
        Rappel : <span className="text-white/70">login = message signé</span> • <span className="text-white/70">swap/LP = transaction</span>.
      </div>
    </div>
  );
}
