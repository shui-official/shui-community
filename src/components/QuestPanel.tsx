import { useEffect, useMemo, useState } from "react";

type Quest = {
  id: string;
  title: string;
  description: string;
  points: number;
  kind: "social" | "learn" | "community";
  verification: "manual";
  claimed: boolean;
};

type ListOk = { ok: true; wallet: string; points: number; quests: Quest[]; updatedAt: number };
type ListErr = { ok: false; error: string };
type ListRes = ListOk | ListErr;

export default function QuestPanel() {
  const [data, setData] = useState<ListRes | null>(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const okData = useMemo(() => (data?.ok ? data : null), [data]);

  async function refresh() {
    setErr("");
    setLoading(true);
    try {
      const r = await fetch("/api/quest/list");
      const j = (await r.json()) as ListRes;
      setData(j);
      if (!j.ok) setErr(("error" in j && typeof (j as any).error === "string") ? (j as any).error : "error");
    } catch (e: any) {
      setErr(e?.message || "Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh().catch(() => {});
  }, []);

  async function claim(questId: string) {
    setErr("");
    setClaiming(questId);
    try {
      const r = await fetch("/api/quest/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "quest-claim", questId }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "claim_failed");
      await refresh();
    } catch (e: any) {
      setErr(e?.message || "Erreur claim");
    } finally {
      setClaiming(null);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-white/90">Quêtes & Rewards</div>
          <p className="mt-1 text-sm text-white/70">
            V1 : claim off-chain (sans transaction). V2+ : on ajoutera des preuves automatiques.
          </p>
        </div>

        <button
          onClick={refresh}
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          disabled={loading}
        >
          {loading ? "…" : "Rafraîchir"}
        </button>
      </div>

      <div className="mt-4 text-sm text-white/70">
        Points : <span className="text-white font-semibold">{okData ? okData.points : "—"}</span>
      </div>

      {err ? <div className="mt-3 text-sm text-red-300">{err}</div> : null}

      <div className="mt-4 grid gap-3">
        {okData?.quests?.map((q) => (
          <div key={q.id} className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold">{q.title}</div>
                <div className="mt-1 text-sm text-white/70">{q.description}</div>
                <div className="mt-2 text-xs text-white/50">
                  +{q.points} pts • {q.kind} • vérif : {q.verification}
                </div>
              </div>

              {q.claimed ? (
                <span className="inline-flex items-center rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-200">
                  Claimed
                </span>
              ) : (
                <button
                  onClick={() => claim(q.id)}
                  disabled={claiming === q.id}
                  className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
                >
                  {claiming === q.id ? "Claim…" : "Claim"}
                </button>
              )}
            </div>
          </div>
        ))}

        {data?.ok && !data.quests.length && <div className="text-sm text-white/60">Aucune quête disponible.</div>}

        {!data && <div className="text-sm text-white/60">Chargement…</div>}
      </div>

      <p className="mt-4 text-xs text-white/50">
        Sécurité : endpoints protégés par session V2 + allowlist “quest-claim” + rate-limit.
      </p>
    </div>
  );
}
