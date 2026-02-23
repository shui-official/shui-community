import React from "react";
import { useBeginnerMode } from "../contexts/BeginnerMode";

type Props = {
  title?: string;
  children: React.ReactNode; // zone ciblée
  hintText: string;          // contenu simple (lisible)
};

export default function BeginnerHint({ title = "Mode Débutant", children, hintText }: Props) {
  const { isBeginner, openCoach } = useBeginnerMode();

  // Hors mode débutant : on ne change rien
  if (!isBeginner) return <>{children}</>;

  return (
    <div className="relative">
      {/* Highlight pro (léger) */}
      <div className="rounded-2xl transition hover:ring-2 hover:ring-emerald-300/15">
        {children}
      </div>

      {/* Bouton ? (pro & mobile-first) */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          openCoach(title, hintText);
        }}
        className={[
          "absolute right-3 top-3 z-[10] pointer-events-auto",
          "h-7 w-7 rounded-full border border-white/15 bg-black/40",
          "text-xs font-bold text-white/90 hover:bg-black/55",
          "shadow-[0_12px_30px_rgba(0,0,0,0.45)]",
        ].join(" ")}
        aria-label={`Aide : ${title}`}
        title="Aide"
      >
        ?
      </button>
    </div>
  );
}
