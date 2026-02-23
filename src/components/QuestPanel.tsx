import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "next-i18next";

type QuestPoints =
  | number
  | { mode?: "fixed"; points?: number }
  | { mode?: "holder-mult"; multiplier?: number }
  | { mode?: "lp-mult"; multiplier?: number }
  | { mode?: string; [k: string]: any };

type Quest = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  points: QuestPoints;
  kind: "social" | "learn" | "community" | "daily" | "onchain";
  verification: "manual" | "social" | "onchain-hold" | "onchain-lp";
  cooldown: "once" | "daily";
  claimed: boolean;
};

type PointsBreakdown = { activity: number; onchain: number; total: number };

type ListOk = {
  ok: true;
  month?: string;
  wallet: string;
  points: PointsBreakdown | number;
  quests: Quest[];
  updatedAt: number;
};
type ListErr = { ok: false; error: string };
type ListRes = ListOk | ListErr;

function asPoints(p: ListOk["points"]): PointsBreakdown {
  if (typeof p === "number") return { activity: p, onchain: 0, total: p };
  if (p && typeof p === "object") {
    const activity = Number((p as any).activity ?? 0);
    const onchain = Number((p as any).onchain ?? 0);
    const total = Number((p as any).total ?? activity + onchain);
    return { activity, onchain, total };
  }
  return { activity: 0, onchain: 0, total: 0 };
}

function safeText(v: any, fallback: string) {
  if (typeof v === "string" && v.trim().length > 0) return v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return fallback;
}

function pointsLabel(t: any, p: QuestPoints): string {
  if (typeof p === "number") return `+${p}`;
  if (!p || typeof p !== "object") return "+0";

  const mode = (p as any).mode;

  if (mode === "fixed") {
    const pts = Number((p as any).points ?? 0);
    return `+${Number.isFinite(pts) ? pts : 0}`;
  }
  if (mode === "holder-mult") {
    const mult = Number((p as any).multiplier ?? 0);
    const m = Number.isFinite(mult) ? mult : 0;
    return `x${m} ${safeText(t("quests.pointsPerShui", "/ SHUI"), "/ SHUI")}`;
  }
  if (mode === "lp-mult") {
    const mult = Number((p as any).multiplier ?? 0);
    const m = Number.isFinite(mult) ? mult : 0;
    return `x${m} ${safeText(t("quests.pointsPerLp", "/ LP"), "/ LP")}`;
  }
  return safeText(mode, "+0");
}

export default function QuestPanel() {
  const { t } = useTranslation("common");
  const [data, setData] = useState<ListRes | null>(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const okData = useMemo(() => (data?.ok ? (data as ListOk) : null), [data]);
  const pts = useMemo(() => (okData ? asPoints(okData.points) : null), [okData]);

  async function refresh() {
    setErr("");
    setLoading(true);
    try {
      const r = await fetch("/api/quest/list");
      const j = (await r.json()) as ListRes;
      setData(j);
      if (!j.ok) setErr(typeof (j as any).error === "string" ? (j as any).error : "error");
    } catch (e: any) {
      setErr(e?.message || safeText(t("error.network", "Erreur réseau"), "Erreur réseau"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setErr(e?.message || safeText(t("error.claim", "Erreur claim"), "Erreur claim"));
    } finally {
      setClaiming(null);
    }
  }

  // --- Telegram ---

  async function sessionOk(): Promise<boolean> {
    try {
      const r = await fetch("/api/auth/me", { method: "GET" });
      const j = await r.json();
      return !!j?.ok;
    } catch {
      return false;
    }
  }

  // --- Telegram ---
  async function openTelegramLink() {
    setErr("");
    try {
      const r = await fetch("/api/telegram/link", { method: "POST" });
      const j = await r.json();
      if (!j.ok || !j.url) throw new Error(j.error || "telegram_link_failed");
      window.location.href = j.url; // pas de popup
    } catch (e: any) {
      setErr(e?.message || "telegram_link_failed");
    }
  }

  async function verifyTelegramAndClaim() {
    setErr("");
    setClaiming("join-telegram");
    try {
      const v = await fetch("/api/telegram/verify", { method: "POST" });
      const jv = await v.json();
      if (!jv.ok) throw new Error(jv.error || "telegram_verify_failed");
      await claim("join-telegram");
    } catch (e: any) {
      setErr(e?.message || "telegram_verify_failed");
      setClaiming(null);
    }
  }

  // --- X ---
  async function openXLink() {
    setErr("");
    try {
      const r = await fetch("/api/x/link", { method: "POST" });
      const j = await r.json();
      if (!j.ok || !j.url) throw new Error(j.error || "x_link_failed");
      window.location.href = j.url; // pas de popup
    } catch (e: any) {
      setErr(e?.message || "x_link_failed");
    }
  }

  async function verifyXAndClaim() {
    setErr("");
    setClaiming("follow-x");
    try {
      const v = await fetch("/api/x/verify", { method: "POST" });
      const jv = await v.json();
      if (!jv.ok) throw new Error(jv.error || "x_verify_failed");
      await claim("follow-x");
    } catch (e: any) {
      setErr(e?.message || "x_verify_failed");
      setClaiming(null);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-white/90">
            {safeText(t("quests.panelTitle", "Quêtes & Rewards"), "Quêtes & Rewards")}
          </div>
          <p className="mt-1 text-sm text-white/70">
            {safeText(
              t(
                "quests.panelSubtitle",
                "Points off-chain (sans transaction). Bonus on-chain (holder/LP) : pondérés + plafonnés."
              ),
              "Points off-chain (sans transaction). Bonus on-chain (holder/LP) : pondérés + plafonnés."
            )}
          </p>
          {okData?.month ? (
            <div className="mt-1 text-xs text-white/50">
              {safeText(t("quests.period", "Période"), "Période")} :{" "}
              <span className="text-white/70">{okData.month}</span>
            </div>
          ) : null}
        </div>

        <button
          onClick={refresh}
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          disabled={loading}
          type="button"
        >
          {loading ? "…" : safeText(t("quests.refresh", "Rafraîchir"), "Rafraîchir")}
        </button>
      </div>

      <div className="mt-4 text-sm text-white/70">
        {safeText(t("quests.pointsTotal", "Points total"), "Points total")} :{" "}
        <span className="text-white font-semibold">{pts ? pts.total : "—"}</span>
      </div>

      {err ? <div className="mt-3 text-sm text-red-300">{safeText(err, "error")}</div> : null}

      <div className="mt-4 grid gap-3">
        {okData?.quests?.map((q) => {
          const title = safeText(t(q.titleKey, q.titleKey), q.titleKey);
          const description = safeText(t(q.descriptionKey, q.descriptionKey), q.descriptionKey);

          const isTelegramQuest = q.id === "join-telegram";
          const isXQuest = q.id === "follow-x";

          return (
            <div key={q.id} className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white">{title}</div>
                  <div className="mt-1 text-sm text-white/70">{description}</div>

                  <div className="mt-2 text-xs text-white/50">
                    <span className="text-white/80 font-semibold">{pointsLabel(t, q.points)}</span>{" "}
                    {safeText(t("quests.pointsSuffix", "pts"), "pts")}
                    {" • "}
                    {q.kind}
                    {" • "}
                    {safeText(t("quests.verify", "vérif"), "vérif")} : {q.verification}
                    {" • "}
                    {q.cooldown}
                  </div>

                  {isTelegramQuest && !q.claimed ? (
                    <div className="mt-3 text-xs text-white/60">
                      {safeText(
                        t("quests.telegram.help", "Étapes : ouvrir le bot Telegram → appuyer Start → revenir ici et cliquer Vérifier."),
                        "Étapes : ouvrir le bot Telegram → appuyer Start → revenir ici et cliquer Vérifier."
                      )}
                    </div>
                  ) : null}
                </div>

                {q.claimed ? (
                  <span className="inline-flex items-center rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-200">
                    {safeText(t("quests.claimed", "Validé"), "Validé")}
                  </span>
                ) : isTelegramQuest ? (
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={openTelegramLink}
                      className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
                      type="button"
                    >
                      {safeText(t("quests.telegram.open", "Ouvrir Telegram"), "Ouvrir Telegram")}
                    </button>
                    <button
                      onClick={verifyTelegramAndClaim}
                      disabled={claiming === "join-telegram"}
                      className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
                      type="button"
                    >
                      {claiming === "join-telegram"
                        ? safeText(t("quests.telegram.verifying", "Vérification…"), "Vérification…")
                        : safeText(t("quests.telegram.verify", "Vérifier"), "Vérifier")}
                    </button>
                  </div>
                ) : isXQuest ? (
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={openXLink}
                      className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
                      type="button"
                    >
                      {safeText(t("quests.x.open", "Connecter X"), "Connecter X")}
                    </button>
                    <button
                      onClick={verifyXAndClaim}
                      disabled={claiming === "follow-x"}
                      className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
                      type="button"
                    >
                      {claiming === "follow-x"
                        ? safeText(t("quests.x.verifying", "Vérification…"), "Vérification…")
                        : safeText(t("quests.x.verify", "Vérifier"), "Vérifier")}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => claim(q.id)}
                    disabled={claiming === q.id}
                    className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
                    type="button"
                  >
                    {claiming === q.id
                      ? safeText(t("quests.claiming", "Validation…"), "Validation…")
                      : safeText(t("quests.claim", "Valider"), "Valider")}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
