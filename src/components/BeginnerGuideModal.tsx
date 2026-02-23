import React, { useEffect, useMemo } from "react";
import { buildGuideSteps, buildGlossary } from "../lib/beginner/guideSteps";
import { useBeginnerMode } from "../contexts/BeginnerMode";
import { useTranslation } from "next-i18next";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function BeginnerGuideModal() {
  const { t } = useTranslation("common");
  const { isBeginner, guideOpen, setGuideOpen, stepIndex, nextStep, prevStep, resetGuide } = useBeginnerMode();

  const steps = useMemo(() => buildGuideSteps(t), [t]);
  const glossary = useMemo(() => buildGlossary(t), [t]);

  const idx = clamp(stepIndex, 0, steps.length - 1);
  const step = steps[idx];

  const canPrev = idx > 0;
  const canNext = idx < steps.length - 1;

  const title = useMemo(() => {
    const n = idx + 1;
    return t("beginner.guide.header", { n, total: steps.length });
  }, [idx, steps.length, t]);

  const close = () => setGuideOpen(false);

  // ESC pour fermer
  useEffect(() => {
    if (!guideOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guideOpen]);

  if (!isBeginner || !guideOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000]">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/60" onClick={close} />

      {/* modal
          Mobile (default): bottom sheet (full width)
          Desktop (md+): centered modal
      */}
      <div
        className={[
          "absolute z-[1]",
          // Mobile: bottom-sheet
          "left-0 right-0 bottom-0 w-full max-w-none",
          "rounded-t-2xl border border-white/10 bg-[#0b1220]/95 text-white",
          "shadow-[0_20px_80px_rgba(0,0,0,0.65)] backdrop-blur",
          "max-h-[86vh] overflow-y-auto",
          // Desktop: centered modal
          "md:top-1/2 md:left-1/2 md:bottom-auto md:right-auto md:w-[92vw] md:max-w-[560px]",
          "md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:max-h-[82vh]",
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t("beginner.guide.ariaLabel")}
      >
        {/* Header sticky */}
        <div className="sticky top-0 z-[2] border-b border-white/10 bg-[#0b1220]/95 p-5 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs text-white/60">{title}</div>
              <div className="mt-1 text-lg font-semibold text-white">{step.title}</div>
              {step.pageHint ? (
                <div className="mt-1 text-xs text-white/50">
                  {t("beginner.guide.recommendedPage")} <code className="text-white/70">{step.pageHint}</code>
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={close}
                className="h-9 w-9 rounded-xl border border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
                aria-label={t("beginner.guide.close")}
                title={t("beginner.guide.close")}
              >
                ✕
              </button>

              <button
                type="button"
                onClick={close}
                className="hidden sm:inline-flex rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10"
              >
                {t("beginner.guide.close")}
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5">
          <div className="rounded-xl border border-white/10 bg-black/25 p-4">
            <ul className="list-disc space-y-2 pl-5 text-sm text-white/80">
              {step.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>

            {step.warning ? (
              <div className="mt-3 rounded-xl border border-amber-300/20 bg-amber-400/10 p-3 text-xs text-amber-100">
                ⚠️ {step.warning}
              </div>
            ) : null}

            {step.cta?.href ? (
              <a
                href={step.cta.href}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center justify-center rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500"
              >
                {step.cta.label}
              </a>
            ) : null}
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs font-semibold text-white/80">{t("beginner.guide.glossaryTitle")}</div>
            <div className="mt-2 grid gap-2 text-xs text-white/70">
              {glossary.slice(0, 6).map((g) => (
                <div key={g.k}>
                  <span className="text-white/85 font-semibold">{g.k}</span> — {g.v}
                </div>
              ))}
            </div>
            <div className="mt-2 text-[11px] text-white/45">{t("beginner.guide.glossaryNote")}</div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={resetGuide}
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10"
            >
              {t("beginner.guide.restart")}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prevStep}
                disabled={!canPrev}
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 disabled:opacity-40"
              >
                {t("beginner.guide.prev")}
              </button>
              <button
                type="button"
                onClick={nextStep}
                disabled={!canNext}
                className="rounded-xl bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/25 disabled:opacity-40"
              >
                {t("beginner.guide.next")}
              </button>
            </div>
          </div>

          <div className="mt-3 text-[11px] text-white/45">{t("beginner.guide.tip1")}</div>

          <div className="mt-2 text-[11px] text-white/40">{t("beginner.guide.tip2")}</div>

          {/* padding bottom for mobile safe area */}
          <div className="h-2" />
        </div>
      </div>
    </div>
  );
}
