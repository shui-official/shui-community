import React from "react";
import { useBeginnerMode } from "../contexts/BeginnerMode";

export default function BeginnerCoachPanel() {
  const { isBeginner, coachOpen, coachTitle, coachText, closeCoach, setGuideOpen } = useBeginnerMode();

  if (!isBeginner || !coachOpen) return null;

  return (
    <div className="fixed bottom-5 left-5 z-[10000] w-[92vw] max-w-[520px]">
      <div className="rounded-2xl border border-white/10 bg-[#0b1220]/95 p-5 text-white shadow-[0_20px_80px_rgba(0,0,0,0.65)] backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs text-white/60">Coach Débutant</div>
            <div className="mt-1 text-lg font-semibold text-white">{coachTitle}</div>
          </div>
          <button
            type="button"
            onClick={closeCoach}
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10"
          >
            Fermer
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-4 text-sm text-white/85 space-y-2 leading-relaxed">
          {coachText
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean)
            .map((l, i) => (
              <div key={i}>{l}</div>
            ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500"
          >
            Ouvrir le guide
          </button>

          <div className="text-[11px] text-white/50">
            Astuce : clique sur “?” sur une zone pour voir l’explication ici.
          </div>
        </div>
      </div>
    </div>
  );
}
