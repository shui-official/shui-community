import React, { useEffect, useMemo } from "react";
import { GUIDE_STEPS, GLOSSARY } from "../lib/beginner/guideSteps";
import { useBeginnerMode } from "../contexts/BeginnerMode";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function BeginnerGuideModal() {
  const { isBeginner, guideOpen, setGuideOpen, stepIndex, nextStep, prevStep, resetGuide } = useBeginnerMode();

  const steps = GUIDE_STEPS;
  const idx = clamp(stepIndex, 0, steps.length - 1);
  const step = steps[idx];

  const canPrev = idx > 0;
  const canNext = idx < steps.length - 1;

  const title = useMemo(() => {
    const n = idx + 1;
    return `Guide Débutant • Étape ${n}/${steps.length}`;
  }, [idx, steps.length]);

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
        aria-label="Guide Débutant"
      >
        {/* Header sticky */}
        <div className="sticky top-0 z-[2] border-b border-white/10 bg-[#0b1220]/95 p-5 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs text-white/60">{title}</div>
              <div className="mt-1 text-lg font-semibold text-white">{step.title}</div>
              {step.pageHint ? (
                <div className="mt-1 text-xs text-white/50">
                  Page conseillée : <code className="text-white/70">{step.pageHint}</code>
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={close}
                className="h-9 w-9 rounded-xl border border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
                aria-label="Fermer"
                title="Fermer"
              >
                ✕
              </button>

              <button
                type="button"
                onClick={close}
                className="hidden sm:inline-flex rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10"
              >
                Fermer
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
            <div className="text-xs font-semibold text-white/80">Mini-glossaire</div>
            <div className="mt-2 grid gap-2 text-xs text-white/70">
              {GLOSSARY.slice(0, 6).map((g) => (
                <div key={g.k}>
                  <span className="text-white/85 font-semibold">{g.k}</span> — {g.v}
                </div>
              ))}
            </div>
            <div className="mt-2 text-[11px] text-white/45">
              (Le glossaire complet s’étendra plus tard — là c’est la version “utile tout de suite”.)
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={resetGuide}
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10"
            >
              Recommencer
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prevStep}
                disabled={!canPrev}
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 disabled:opacity-40"
              >
                ← Précédent
              </button>
              <button
                type="button"
                onClick={nextStep}
                disabled={!canNext}
                className="rounded-xl bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/25 disabled:opacity-40"
              >
                Suivant →
              </button>
            </div>
          </div>

          <div className="mt-3 text-[11px] text-white/45">
            Astuce : ce guide explique “quoi faire” + “quoi signer”. Les swaps/LP demanderont toujours une transaction (normal).
          </div>

          <div className="mt-2 text-[11px] text-white/40">
            Raccourci : appuie sur <span className="text-white/60">ESC</span> pour fermer.
          </div>

          {/* padding bottom for mobile safe area */}
          <div className="h-2" />
        </div>
      </div>
    </div>
  );
}
