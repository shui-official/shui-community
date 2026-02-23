import React from "react";
import { useBeginnerMode } from "../contexts/BeginnerMode";
import BeginnerGuideModal from "./BeginnerGuideModal";

export default function BeginnerModeToggle() {
  const { isBeginner, toggleBeginner, setGuideOpen, resetGuide, guideOpen, coachOpen } = useBeginnerMode();

  // Si guide ouvert, on n’affiche pas l’encart "Aide rapide" (ça évite le stacking)
  const showQuickBox = isBeginner && !guideOpen && !coachOpen;

  return (
    <>
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={toggleBeginner}
          className={[
            "rounded-2xl border px-4 py-2 text-sm font-semibold backdrop-blur",
            "shadow-[0_20px_60px_rgba(0,0,0,0.45)]",
            isBeginner
              ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-200 hover:bg-emerald-400/20"
              : "border-white/15 bg-white/10 text-white/85 hover:bg-white/15",
          ].join(" ")}
          title="Active/désactive l’aide simplifiée (Mode Débutant)."
        >
          Mode Débutant :{" "}
          <span className={isBeginner ? "text-emerald-200" : "text-white/80"}>
            {isBeginner ? "ON" : "OFF"}
          </span>
        </button>

        {showQuickBox ? (
          <div className="max-w-[320px] rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-white/80">
            <div className="font-semibold text-white/90">Aide rapide</div>
            <div className="mt-1">
              Je te guide étape par étape (wallet, achat SHUI, swap, pool) avec des mots simples.
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setGuideOpen(true)}
                className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15"
              >
                Ouvrir le guide
              </button>
              <button
                type="button"
                onClick={resetGuide}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10"
              >
                Recommencer
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <BeginnerGuideModal />
    </>
  );
}
