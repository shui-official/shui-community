// ============================================================
// QuestPanel v2 — Premium SHUI Dashboard Component
// Architecture: auto / semi / manual validation
// Design: cohérent avec ExplorerView /explorer
// Mobile-sync ready
// ============================================================

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "next-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  getLevelProgress,
} from "../lib/quests/catalog";

// ────────────────────────────────────────────────────────────
// Types (aligned with server)
// ────────────────────────────────────────────────────────────

type QuestPoints =
  | number
  | { mode?: "fixed"; points?: number }
  | { mode?: "holder-mult"; multiplier?: number }
  | { mode?: "lp-mult"; multiplier?: number }
  | { mode?: "range"; min?: number; max?: number }
  | { mode?: string; [k: string]: any };

type QuestValidationLevel = "auto" | "semi" | "manual";
type QuestKind = "onboarding" | "education" | "community" | "content" | "product" | "development" | "strategic";

type Quest = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  proofHintKey?: string;
  points: QuestPoints;
  kind: QuestKind | string;
  category: string;
  verification: string;
  validationLevel?: QuestValidationLevel;
  cooldown: "once" | "daily" | "weekly" | "monthly";
  claimed: boolean;
  requiredLevel?: string;
  abuseRisk?: "low" | "medium" | "high";
  mobileSyncable?: boolean;
  tags?: string[];
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

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

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

function rawPointsLabel(p: QuestPoints): string {
  if (typeof p === "number") return `+${p}`;
  if (!p || typeof p !== "object") return "+0";
  const mode = (p as any).mode;
  if (mode === "fixed") return `+${Number((p as any).points ?? 0)}`;
  if (mode === "range") return `+${(p as any).min ?? 0}–${(p as any).max ?? 0}`;
  if (mode === "holder-mult") return `×${(p as any).multiplier ?? 0}/SHUI`;
  if (mode === "lp-mult") return `×${(p as any).multiplier ?? 0}/LP`;
  return "+?";
}

function rawPointsToShui(p: QuestPoints): string {
  if (typeof p === "number") return `${p * 100}`;
  if (!p || typeof p !== "object") return "0";
  const mode = (p as any).mode;
  if (mode === "fixed") {
    const pts = Number((p as any).points ?? 0);
    return `${pts * 100}`;
  }
  if (mode === "range") {
    const min = Number((p as any).min ?? 0);
    const max = Number((p as any).max ?? 0);
    return `${min * 100}–${max * 100}`;
  }
  return "—";
}

const CATEGORY_META: Record<string, { label: string; icon: string; color: string; desc: string }> = {
  onboarding:  { label: "Onboarding",    icon: "🚀", color: "#38bdf8", desc: "Premiers pas dans SHUI" },
  education:   { label: "Éducation",      icon: "📚", color: "#22d3ee", desc: "Apprendre et comprendre" },
  community:   { label: "Communauté",     icon: "🤝", color: "#34d399", desc: "Faire grandir la communauté" },
  content:     { label: "Contenu",        icon: "✍️",  color: "#a78bfa", desc: "Créer du contenu utile" },
  product:     { label: "Produit",        icon: "🔬", color: "#fb923c", desc: "Améliorer le produit" },
  development: { label: "Développement",  icon: "⚙️",  color: "#818cf8", desc: "Construire l'infrastructure" },
  strategic:   { label: "Stratégique",    icon: "🎯", color: "#6366f1", desc: "Missions de crédibilité" },
  onchain:     { label: "On-chain",       icon: "⛓️",  color: "#f59e0b", desc: "Actions blockchain" },
};

const VALIDATION_META: Record<string, { label: string; badge: string; color: string; icon: string }> = {
  auto:   { label: "Automatique",   badge: "AUTO",   color: "#34d399", icon: "⚡" },
  semi:   { label: "Semi-auto",     badge: "SEMI",   color: "#fbbf24", icon: "🔍" },
  manual: { label: "Manuelle",      badge: "MANUEL", color: "#a78bfa", icon: "👁️" },
};

const LEVEL_META = {
  goutte:  { label: "Goutte",  emoji: "💧", color: "#38bdf8", range: "0–99 pts" },
  flux:    { label: "Flux",    emoji: "🌊", color: "#22d3ee", range: "100–399 pts" },
  riviere: { label: "Rivière", emoji: "🏞️", color: "#818cf8", range: "400–1199 pts" },
  ocean:   { label: "Océan",   emoji: "🌏", color: "#6366f1", range: "1200+ pts" },
};

// ────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────

function ValidationBadge({ level }: { level?: QuestValidationLevel }) {
  const meta = VALIDATION_META[level ?? "manual"];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{
        background: `${meta.color}18`,
        border: `1px solid ${meta.color}35`,
        color: meta.color,
      }}
    >
      {meta.icon} {meta.badge}
    </span>
  );
}

function PointsBadge({ points }: { points: QuestPoints }) {
  const label = rawPointsLabel(points);
  const shui = rawPointsToShui(points);
  return (
    <div className="flex flex-col items-end">
      <span className="text-sm font-extrabold text-white">{label}</span>
      <span className="text-[10px] text-slate-500">≈ {shui} SHUI</span>
    </div>
  );
}

function LevelBadge({ level }: { level?: string }) {
  if (!level) return null;
  const meta = LEVEL_META[level as keyof typeof LEVEL_META];
  if (!meta) return null;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
      style={{ background: `${meta.color}15`, color: meta.color, border: `1px solid ${meta.color}30` }}
    >
      {meta.emoji} {meta.label}+
    </span>
  );
}

function CooldownBadge({ cooldown }: { cooldown: string }) {
  const map: Record<string, string> = { once: "Unique", daily: "Quotidien", weekly: "Hebdo", monthly: "Mensuel" };
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-500">
      {map[cooldown] ?? cooldown}
    </span>
  );
}

// Progress bar for level
function LevelProgressBar({ totalPoints }: { totalPoints: number }) {
  const info = getLevelProgress(totalPoints);
  const meta = LEVEL_META[info.level];
  const nextMeta = info.nextMin ? LEVEL_META[Object.keys(LEVEL_META).find(k => LEVEL_META[k as keyof typeof LEVEL_META].range.startsWith(info.nextMin + ""))  ?? "flux" as keyof typeof LEVEL_META] : null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-bold" style={{ color: meta.color }}>
          {meta.emoji} {meta.label}
        </span>
        <span className="text-slate-500">
          {info.pointsToNext != null ? `${info.pointsToNext} pts → ${Object.entries(LEVEL_META)[Object.keys(LEVEL_META).indexOf(info.level) + 1]?.[1]?.label ?? "max"}` : "Niveau max"}
        </span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-white/8">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: `linear-gradient(90deg, ${meta.color}, ${meta.color}99)` }}
          initial={{ width: "0%" }}
          animate={{ width: `${info.progress}%` }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <div className="text-[10px] text-slate-600">{totalPoints} / {info.nextMin ?? "∞"} points</div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Quest Card
// ────────────────────────────────────────────────────────────

type TStr = (key: string, fallback?: string) => string;

type QuestCardProps = {
  quest: Quest;
  t: TStr;
  claiming: string | null;
  onClaim: (id: string) => Promise<void>;
  onTelegramOpen: () => void;
  onTelegramVerify: () => void;
  onXOpen: () => void;
  onXVerify: () => void;
  proofUrls: Record<string, string>;
  onProofChange: (id: string, value: string) => void;
  onProofSubmit: (id: string) => void;
};

function QuestCard({
  quest,
  t,
  claiming,
  onClaim,
  onTelegramOpen,
  onTelegramVerify,
  onXOpen,
  onXVerify,
  proofUrls,
  onProofChange,
  onProofSubmit,
}: QuestCardProps) {
  const [expanded, setExpanded] = useState(false);
  const catMeta = CATEGORY_META[quest.category] ?? CATEGORY_META.onboarding;
  const validLevel = (quest.validationLevel as QuestValidationLevel) ?? "manual";
  const isTelegram = quest.id === "join-telegram";
  const isX = quest.id === "follow-x";
  const isSemiOrManual = validLevel === "semi" || validLevel === "manual";
  const proofValue = proofUrls[quest.id] ?? "";
  const isClaiming = claiming === quest.id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="group relative overflow-hidden rounded-2xl border transition-all duration-300"
      style={{
        borderColor: quest.claimed ? "rgba(52,211,153,0.25)" : `${catMeta.color}20`,
        background: quest.claimed
          ? "rgba(52,211,153,0.04)"
          : `linear-gradient(135deg, ${catMeta.color}04, transparent)`,
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute inset-x-0 top-0 h-[1px]"
        style={{
          background: quest.claimed
            ? "linear-gradient(90deg, transparent, rgba(52,211,153,0.4), transparent)"
            : `linear-gradient(90deg, transparent, ${catMeta.color}50, transparent)`,
        }}
      />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            {/* Category icon */}
            <div
              className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-base"
              style={{ background: `${catMeta.color}12`, border: `1px solid ${catMeta.color}25` }}
            >
              {catMeta.icon}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                <span className="text-sm font-bold leading-tight text-white">
                  {safeText(t(quest.titleKey, quest.titleKey), quest.titleKey)}
                </span>
                {quest.claimed && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    ✓ Validé
                  </span>
                )}
              </div>

              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <ValidationBadge level={validLevel} />
                {quest.requiredLevel && <LevelBadge level={quest.requiredLevel} />}
                <CooldownBadge cooldown={quest.cooldown} />
              </div>
            </div>
          </div>

          {/* Points */}
          {!quest.claimed && <PointsBadge points={quest.points} />}
        </div>

        {/* Description (collapsible) */}
        <button
          type="button"
          className="mt-3 flex w-full items-center gap-1 text-left text-xs text-slate-400 hover:text-slate-300 transition-colors"
          onClick={() => setExpanded((v) => !v)}
        >
          <span className="flex-1 leading-relaxed">
            {safeText(t(quest.descriptionKey, quest.descriptionKey), quest.descriptionKey)}
          </span>
          <span className={`flex-shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>▾</span>
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-2 border-t border-white/6 pt-3">
                {/* Proof hint */}
                {quest.proofHintKey && (
                  <div className="flex items-start gap-2 rounded-xl border border-white/8 bg-white/3 p-3 text-xs text-slate-400">
                    <span className="mt-0.5 flex-shrink-0">📎</span>
                    <span>{safeText(t(quest.proofHintKey, quest.proofHintKey), quest.proofHintKey)}</span>
                  </div>
                )}

                {/* Proof input for semi/manual quests */}
                {isSemiOrManual && !quest.claimed && !isTelegram && !isX && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={proofValue}
                      onChange={(e) => onProofChange(quest.id, e.target.value)}
                      placeholder="URL de preuve ou lien…"
                      className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-white/25 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => onProofSubmit(quest.id)}
                      disabled={!proofValue.trim() || isClaiming}
                      className="rounded-xl px-3 py-2 text-xs font-bold text-white transition-all disabled:opacity-40"
                      style={{
                        background: proofValue.trim()
                          ? `linear-gradient(135deg, ${catMeta.color}80, ${catMeta.color}40)`
                          : "rgba(255,255,255,0.05)",
                        border: `1px solid ${catMeta.color}30`,
                      }}
                    >
                      {isClaiming ? "…" : "Soumettre"}
                    </button>
                  </div>
                )}

                {/* Telegram help */}
                {isTelegram && !quest.claimed && (
                  <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-slate-400">
                    Étapes : ouvrir le bot Telegram → appuyer Start → revenir ici et cliquer Vérifier.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA Buttons */}
        {!quest.claimed && (
          <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
            {isTelegram ? (
              <>
                <button
                  type="button"
                  onClick={onTelegramOpen}
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  Ouvrir Telegram
                </button>
                <button
                  type="button"
                  onClick={onTelegramVerify}
                  disabled={claiming === "join-telegram"}
                  className="rounded-xl px-3 py-1.5 text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, #38bdf8, #818cf8)` }}
                >
                  {claiming === "join-telegram" ? "Vérification…" : "Vérifier"}
                </button>
              </>
            ) : isX ? (
              <>
                <button
                  type="button"
                  onClick={onXOpen}
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  Connecter X
                </button>
                <button
                  type="button"
                  onClick={onXVerify}
                  disabled={claiming === "follow-x"}
                  className="rounded-xl px-3 py-1.5 text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, #38bdf8, #818cf8)` }}
                >
                  {claiming === "follow-x" ? "Vérification…" : "Vérifier"}
                </button>
              </>
            ) : validLevel === "auto" ? (
              <button
                type="button"
                onClick={() => onClaim(quest.id)}
                disabled={isClaiming}
                className="rounded-xl px-3 py-1.5 text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #34d399, #22d3ee)" }}
              >
                {isClaiming ? "Validation…" : "⚡ Valider auto"}
              </button>
            ) : validLevel === "semi" ? (
              !expanded && (
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="rounded-xl border border-yellow-500/30 bg-yellow-500/8 px-3 py-1.5 text-xs font-bold text-yellow-300 hover:bg-yellow-500/15 transition-colors"
                >
                  🔍 Soumettre preuve
                </button>
              )
            ) : (
              !expanded && (
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="rounded-xl border border-violet-500/30 bg-violet-500/8 px-3 py-1.5 text-xs font-bold text-violet-300 hover:bg-violet-500/15 transition-colors"
                >
                  👁️ Soumettre
                </button>
              )
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────
// Stats Summary Cards
// ────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, color, icon,
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
  icon: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-4"
      style={{ borderColor: `${color}20`, background: `${color}06` }}
    >
      <div className="absolute inset-x-0 top-0 h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${color}40, transparent)` }} />
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-slate-500 mb-1">{label}</div>
          <div className="text-xl font-extrabold text-white">{value}</div>
          {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
        </div>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl text-base"
          style={{ background: `${color}15`, border: `1px solid ${color}25` }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main QuestPanel component
// ────────────────────────────────────────────────────────────

const ALL_CAT = "__all__";

export default function QuestPanel() {
  const { t } = useTranslation("common");
  // Typed wrapper — avoids TFunction signature complexity in sub-components
  const tStr: TStr = (key: string, fallback?: string) => {
    const res = t(key, fallback as any);
    return typeof res === "string" ? res : (fallback ?? key);
  };
  const [data, setData] = useState<ListRes | null>(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CAT);
  const [proofUrls, setProofUrls] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"available" | "claimed">("available");

  const okData = useMemo(() => (data?.ok ? (data as ListOk) : null), [data]);
  const pts = useMemo(() => (okData ? asPoints(okData.points) : null), [okData]);

  const totalPoints = pts?.total ?? 0;
  const levelInfo = getLevelProgress(totalPoints);
  const levelMeta = LEVEL_META[levelInfo.level];

  // All quests
  const allQuests = useMemo(() => okData?.quests ?? [], [okData]);

  // Filter by category and tab
  const displayedQuests = useMemo(() => {
    let list = allQuests;
    if (activeCategory !== ALL_CAT) {
      list = list.filter((q) => q.category === activeCategory);
    }
    if (activeTab === "available") {
      list = list.filter((q) => !q.claimed);
    } else {
      list = list.filter((q) => q.claimed);
    }
    return list;
  }, [allQuests, activeCategory, activeTab]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, { available: number; claimed: number }> = {};
    allQuests.forEach((q) => {
      const cat = q.category ?? "onboarding";
      if (!counts[cat]) counts[cat] = { available: 0, claimed: 0 };
      if (q.claimed) counts[cat].claimed++;
      else counts[cat].available++;
    });
    return counts;
  }, [allQuests]);

  const totalClaimed = useMemo(() => allQuests.filter((q) => q.claimed).length, [allQuests]);
  const totalAvailable = useMemo(() => allQuests.filter((q) => !q.claimed).length, [allQuests]);
  const estimatedShui = useMemo(() => totalPoints * 100, [totalPoints]);

  // ── API Calls ──────────────────────────────────────────────

  async function refresh() {
    setErr("");
    setLoading(true);
    try {
      const r = await fetch("/api/quest/list");
      const j = (await r.json()) as ListRes;
      setData(j);
      if (!j.ok) setErr(typeof (j as any).error === "string" ? (j as any).error : "error");
    } catch (e: any) {
      setErr(e?.message || "Erreur réseau");
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
      setErr(e?.message || "Erreur claim");
    } finally {
      setClaiming(null);
    }
  }

  async function claimWithProof(questId: string) {
    const proof = proofUrls[questId]?.trim();
    if (!proof) return;
    setErr("");
    setClaiming(questId);
    try {
      const r = await fetch("/api/quest/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "quest-claim", questId, proof }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "claim_failed");
      setProofUrls((prev) => { const n = { ...prev }; delete n[questId]; return n; });
      await refresh();
    } catch (e: any) {
      setErr(e?.message || "Erreur claim");
    } finally {
      setClaiming(null);
    }
  }

  async function openTelegramLink() {
    setErr("");
    try {
      const r = await fetch("/api/telegram/link", { method: "POST" });
      const j = await r.json();
      if (!j.ok || !j.url) throw new Error(j.error || "telegram_link_failed");
      window.location.href = j.url;
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

  async function openXLink() {
    setErr("");
    try {
      const r = await fetch("/api/x/link", { method: "POST" });
      const j = await r.json();
      if (!j.ok || !j.url) throw new Error(j.error || "x_link_failed");
      window.location.href = j.url;
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

  // ── Categories with data ──
  const activeCatsWithData = useMemo(() => {
    const catSet = new Set(allQuests.map((q) => q.category ?? "onboarding"));
    return Array.from(catSet);
  }, [allQuests]);

  // ──────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── HEADER + LEVEL ── */}
      <div className="relative overflow-hidden rounded-2xl border p-6" style={{ borderColor: `${levelMeta.color}25`, background: `linear-gradient(135deg, ${levelMeta.color}06, transparent)` }}>
        <div className="absolute inset-x-0 top-0 h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${levelMeta.color}50, transparent)` }} />

        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          {/* Identity + Level */}
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl flex-shrink-0"
              style={{ background: `${levelMeta.color}15`, border: `1px solid ${levelMeta.color}30`, boxShadow: `0 0 20px ${levelMeta.color}15` }}
            >
              {levelMeta.emoji}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-extrabold text-white">{levelMeta.label}</span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: `${levelMeta.color}20`, color: levelMeta.color, border: `1px solid ${levelMeta.color}35` }}
                >
                  {levelMeta.range}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                <span className="font-semibold text-white">{totalPoints}</span> points validés
              </div>
            </div>
          </div>

          {/* Refresh button */}
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2 self-start rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <span className={loading ? "animate-spin" : ""}>↻</span>
            {loading ? "…" : "Actualiser"}
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <LevelProgressBar totalPoints={totalPoints} />
        </div>

        {/* Quick stats */}
        {pts && (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatCard label="Points activité" value={String(pts.activity)} color="#38bdf8" icon="⚡" />
            <StatCard label="Points on-chain" value={String(pts.onchain)} color="#f59e0b" icon="⛓️" />
            <StatCard label="SHUI estimés" value={`≈ ${estimatedShui.toLocaleString()}`} sub="avant vesting" color="#34d399" icon="💧" />
            <StatCard label="Quêtes validées" value={`${totalClaimed}/${allQuests.length}`} color="#a78bfa" icon="✓" />
          </div>
        )}
      </div>

      {/* ── VESTING INFO ── */}
      <div className="rounded-2xl border border-white/8 bg-white/3 px-5 py-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Règle de paiement</span>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span><span className="font-semibold text-white">25%</span> distribués immédiatement</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-400" />
            <span><span className="font-semibold text-white">75%</span> en vesting progressif</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-violet-400" />
            <span>Plafond: <span className="font-semibold text-white">15 000 SHUI/mois</span></span>
          </div>
        </div>
      </div>

      {/* ── ERROR ── */}
      {err && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-300">
          {safeText(err, "Erreur")}
        </div>
      )}

      {/* ── LOADING STATE ── */}
      {loading && !okData && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-white/8 bg-white/3" />
          ))}
        </div>
      )}

      {/* ── QUEST SECTION ── */}
      {okData && (
        <div className="space-y-4">
          {/* Available / Claimed tabs */}
          <div className="flex items-center gap-2">
            {(["available", "claimed"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-all duration-300"
                style={
                  activeTab === tab
                    ? { background: "rgba(56,189,248,0.15)", border: "1px solid rgba(56,189,248,0.3)", color: "#67e8f9" }
                    : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(148,163,184,1)" }
                }
              >
                {tab === "available" ? `Disponibles` : `Validées`}
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                  style={
                    activeTab === tab
                      ? { background: "rgba(56,189,248,0.25)", color: "#67e8f9" }
                      : { background: "rgba(255,255,255,0.07)", color: "rgba(148,163,184,0.7)" }
                  }
                >
                  {tab === "available" ? totalAvailable : totalClaimed}
                </span>
              </button>
            ))}
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setActiveCategory(ALL_CAT)}
              className="rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-300"
              style={
                activeCategory === ALL_CAT
                  ? { background: "linear-gradient(135deg, rgba(34,211,238,0.2), rgba(99,102,241,0.2))", border: "1px solid rgba(34,211,238,0.35)", color: "#67e8f9" }
                  : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(148,163,184,1)" }
              }
            >
              Toutes
            </button>

            {activeCatsWithData.map((cat) => {
              const meta = CATEGORY_META[cat] ?? CATEGORY_META.onboarding;
              const counts = categoryCounts[cat] ?? { available: 0, claimed: 0 };
              const isActive = activeCategory === cat;
              const count = activeTab === "available" ? counts.available : counts.claimed;
              if (count === 0 && !isActive) return null;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-300"
                  style={
                    isActive
                      ? {
                          background: `${meta.color}20`,
                          border: `1px solid ${meta.color}40`,
                          color: meta.color,
                        }
                      : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(148,163,184,1)" }
                  }
                >
                  {meta.icon} {meta.label}
                  {count > 0 && (
                    <span
                      className="rounded-full px-1.5 text-[10px]"
                      style={{ background: isActive ? `${meta.color}30` : "rgba(255,255,255,0.07)", color: isActive ? meta.color : "rgba(148,163,184,0.6)" }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Validation legend */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/6 bg-white/2 px-4 py-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Validation</span>
            {Object.entries(VALIDATION_META).map(([key, meta]) => (
              <div key={key} className="flex items-center gap-1 text-[10px]" style={{ color: meta.color }}>
                <span>{meta.icon}</span>
                <span className="font-semibold">{meta.badge}</span>
                <span className="text-slate-600">— {meta.label}</span>
              </div>
            ))}
          </div>

          {/* Quest list */}
          {displayedQuests.length === 0 ? (
            <div className="rounded-2xl border border-white/8 bg-white/3 p-8 text-center">
              <div className="text-3xl mb-2">✨</div>
              <div className="text-sm font-semibold text-white mb-1">
                {activeTab === "claimed" ? "Aucune quête validée dans cette catégorie" : "Toutes les quêtes sont validées !"}
              </div>
              <div className="text-xs text-slate-500">
                {activeTab === "available" ? "Excellent travail — reviens plus tard pour de nouvelles missions." : "Sélectionne une autre catégorie."}
              </div>
            </div>
          ) : (
            <motion.div layout className="grid gap-3 sm:grid-cols-1 lg:grid-cols-1">
              <AnimatePresence>
                {displayedQuests.map((q) => (
                  <QuestCard
                    key={q.id}
                    quest={q}
                    t={tStr}
                    claiming={claiming}
                    onClaim={claim}
                    onTelegramOpen={openTelegramLink}
                    onTelegramVerify={verifyTelegramAndClaim}
                    onXOpen={openXLink}
                    onXVerify={verifyXAndClaim}
                    proofUrls={proofUrls}
                    onProofChange={(id, val) => setProofUrls((prev) => ({ ...prev, [id]: val }))}
                    onProofSubmit={claimWithProof}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      )}

      {/* ── MOBILE SYNC HINT ── */}
      <div className="rounded-2xl border border-white/8 bg-white/2 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-base">📱</div>
          <div>
            <div className="text-xs font-bold text-white">Sync application mobile</div>
            <div className="text-xs text-slate-500 mt-0.5">
              Ton historique, tes points et tes quêtes seront synchronisés avec l&apos;application mobile SHUI.
            </div>
          </div>
          <span className="ml-auto rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-500 flex-shrink-0">
            Bientôt
          </span>
        </div>
      </div>
    </div>
  );
}
