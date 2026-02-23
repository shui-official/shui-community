import React, { useMemo } from "react";
import { useRouter } from "next/router";
import { useWallet } from "@solana/wallet-adapter-react";
import { useBeginnerMode } from "../contexts/BeginnerMode";
import { useSessionMe } from "../lib/security/useSessionMe";
import { useTranslation } from "next-i18next";

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
  const { t } = useTranslation("common");
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
          <div className="text-sm font-semibold text-white/90">{t("beginner.progress.title")}</div>
          <div className="mt-1 text-xs text-white/60">{t("beginner.progress.subtitle")}</div>
        </div>

        <button
          type="button"
          onClick={resetProgress}
          className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10"
          title={t("beginner.progress.resetTitle")}
        >
          {t("beginner.progress.reset")}
        </button>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] text-white/55">
          <span>{t("beginner.progress.progressLabel")}</span>
          <span>
            {doneCount}/{t("beginner.progress.totalSteps")}
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full border border-white/10 bg-black/30">
          <div className="h-full bg-emerald-400/30" style={{ width: `${(doneCount / 4) * 100}%` }} />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <StepRow
          done={step1}
          title={t("beginner.progress.step1.title")}
          subtitle={t("beginner.progress.step1.subtitle")}
          action={
            <button
              type="button"
              onClick={() => {
                setDidInstallWallet(!didInstallWallet);
                if (!didInstallWallet) {
                  openCoach(t("beginner.progress.step1.coachTitle"), t("beginner.progress.step1.coachText"));
                }
              }}
              className={[
                "rounded-lg border px-3 py-2 text-xs font-semibold",
                step1 ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-200" : "border-white/15 bg-white/10 text-white/80 hover:bg-white/15",
              ].join(" ")}
            >
              {step1 ? t("beginner.progress.ok") : t("beginner.progress.markOk")}
            </button>
          }
        />

        <StepRow
          done={step2}
          title={t("beginner.progress.step2.title")}
          subtitle={t("beginner.progress.step2.subtitle")}
          action={
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/15"
            >
              {t("beginner.progress.guide")}
            </button>
          }
        />

        <StepRow
          done={step3}
          title={t("beginner.progress.step3.title")}
          subtitle={t("beginner.progress.step3.subtitle")}
          action={
            <button
              type="button"
              onClick={() => {
                router.push("/community#secure-login");
                openCoach(t("beginner.progress.step3.coachTitle"), t("beginner.progress.step3.coachText"));
              }}
              className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/15"
            >
              {t("beginner.progress.go")}
            </button>
          }
        />

        <StepRow
          done={step4}
          title={t("beginner.progress.step4.title")}
          subtitle={t("beginner.progress.step4.subtitle")}
          action={
            <button
              type="button"
              onClick={() => setDidFirstTest(!didFirstTest)}
              className={[
                "rounded-lg border px-3 py-2 text-xs font-semibold",
                step4 ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-200" : "border-white/15 bg-white/10 text-white/80 hover:bg-white/15",
              ].join(" ")}
            >
              {step4 ? t("beginner.progress.ok") : t("beginner.progress.markOk")}
            </button>
          }
        />
      </div>

      <div className="mt-4 text-[11px] text-white/50">
        {t("beginner.progress.reminder")}
      </div>
    </div>
  );
}
