// ============================================================
// Dashboard SHUI — v2 Premium
// Hub communautaire complet, cohérent avec /explorer
// Mobile-sync ready architecture
// Security: lecture seule — aucune modification des mécanismes
// ============================================================

import type { GetServerSideProps } from "next";
import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { motion, AnimatePresence } from "framer-motion";

import { getSession } from "../lib/security/session";
import { getLevelProgress } from "../lib/quests/catalog";
import { getMaintenanceMessage, getMaintenanceTitle, getMaintenanceUntilLabel, isDashboardMaintenanceEnabled } from "../lib/maintenance";
import { getForcedQuestLevel } from "../lib/quests/admin";

// Dynamic components (SSR disabled — wallet/data dependent)
const QuestPanel = dynamic(() => import("../components/QuestPanel"), { ssr: false });
const RewardsPanel = dynamic(() => import("../components/RewardsPanel"), { ssr: false });
const RaydiumPoolPanel = dynamic(() => import("../components/RaydiumPoolPanel"), { ssr: false });

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

type Props = {
  wallet: string;
  exp: number;
  iat: number;
};

const DASHBOARD_MAINTENANCE_UNTIL = new Date("2026-03-19T15:11:00.000Z");


// ────────────────────────────────────────────────────────────
// Server-side: session guard
// ────────────────────────────────────────────────────────────

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const req = ctx.req as any;
  const session = getSession(req);

  if (!session) {
    return { redirect: { destination: "/", permanent: false } };
  }

  const locale = ctx.locale ?? "fr";
  const i18nProps = await serverSideTranslations(locale, ["common"]);

  return {
    props: { wallet: session.wallet, exp: session.exp, iat: session.iat, ...i18nProps } as any,
  };
};

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

async function logoutSession() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // noop
  }
}

function short(addr: string) {
  return addr ? `${addr.slice(0, 4)}…${addr.slice(-4)}` : "";
}

// ────────────────────────────────────────────────────────────
// Design tokens (cohérent avec ExplorerView)
// ────────────────────────────────────────────────────────────

const LEVEL_META = {
  goutte:  { label: "Goutte",  emoji: "💧", color: "#38bdf8", range: "0–99 pts", desc: "Nouveau membre" },
  flux:    { label: "Flux",    emoji: "🌊", color: "#22d3ee", range: "100–399 pts", desc: "Participant actif" },
  riviere: { label: "Rivière", emoji: "🏞️", color: "#818cf8", range: "400–1199 pts", desc: "Contributeur" },
  ocean:   { label: "Océan",   emoji: "🌏", color: "#6366f1", range: "1200+ pts", desc: "Leader communautaire" },
};

// Social links
const SOCIALS = {
  x:        "https://x.com/Shui_Labs",
  tg:       "http://t.me/Shui_Community",
  ig:       "https://www.instagram.com/shui.officialtoken/",
  solscan:  "https://solscan.io/token/CnrMgNn1N3uY6GqD6FeZRdd1uhPViEFxSioWhRZsCz4C",
};

// ────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────

/** Animated background — same style as ExplorerView */
function DashboardBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-[#050d1a]" />
      {/* Radial glows */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 25% 15%, rgba(14,165,233,0.08) 0%, transparent 60%)," +
            "radial-gradient(ellipse 55% 40% at 75% 25%, rgba(129,140,248,0.07) 0%, transparent 60%)," +
            "radial-gradient(ellipse 50% 40% at 50% 90%, rgba(16,185,129,0.05) 0%, transparent 60%)",
        }}
      />
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.012]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />
      {/* Animated wave lines (same as explorer) */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.05]" preserveAspectRatio="none">
        {[0, 1, 2].map((i) => (
          <motion.path
            key={i}
            fill="none"
            stroke="rgba(56,189,248,0.8)"
            strokeWidth="1"
            d={`M0,${300 + i * 100} C300,${260 + i * 100} 600,${340 + i * 100} 900,${300 + i * 100} S1400,${260 + i * 100} 1600,${300 + i * 100}`}
            animate={{
              d: [
                `M0,${300 + i * 100} C300,${260 + i * 100} 600,${340 + i * 100} 900,${300 + i * 100} S1400,${260 + i * 100} 1600,${300 + i * 100}`,
                `M0,${320 + i * 100} C300,${280 + i * 100} 600,${320 + i * 100} 900,${290 + i * 100} S1400,${310 + i * 100} 1600,${320 + i * 100}`,
                `M0,${300 + i * 100} C300,${260 + i * 100} 600,${340 + i * 100} 900,${300 + i * 100} S1400,${260 + i * 100} 1600,${300 + i * 100}`,
              ],
            }}
            transition={{ duration: 8 + i * 2, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </svg>
    </div>
  );
}

/** Top navigation bar */
function DashboardNav({ wallet, t }: { wallet: string; t: (k: string) => string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <motion.nav
      className="fixed left-0 right-0 top-0 z-50"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={`flex items-center justify-between px-6 py-3 transition-all duration-500 ${scrolled ? "border-b border-white/8 bg-black/60 backdrop-blur-xl" : ""}`}>
        {/* Left — brand */}
        <div className="flex items-center gap-3">
          <Link href="/" passHref>
            <a className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-white/8 transition-colors">
              <div className="relative h-7 w-7 overflow-hidden rounded-full ring-1 ring-white/20">
                <Image src="/shui-token.png" alt="SHUI" layout="fill" objectFit="cover" />
              </div>
              <span className="text-xs font-extrabold tracking-wider text-white">SHUI</span>
            </a>
          </Link>

          <div className="hidden h-4 w-px bg-white/10 sm:block" />

          <div className="hidden items-center gap-1 sm:flex">
            {[
              { href: "/explorer", label: "Explorer" },
              { href: "/community", label: "Communauté" },
            ].map((l) => (
              <Link key={l.href} href={l.href} passHref>
                <a className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-400 transition-all hover:bg-white/8 hover:text-white">
                  {l.label}
                </a>
              </Link>
            ))}
          </div>
        </div>

        {/* Right — wallet + status */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-300">{short(wallet)}</span>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

/** Level progression card */
function LevelHeroCard({
  totalPoints,
  forcedLevel,
  wallet,
  questsData,
}: {
  totalPoints: number;
  forcedLevel?: string | null;
  wallet: string;
  questsData: { total: number; claimed: number } | null;
}) {
  const info = getLevelProgress(totalPoints);
  const effectiveLevel =
    (forcedLevel && forcedLevel in LEVEL_META
      ? forcedLevel
      : info.level) as keyof typeof LEVEL_META;
  const meta = LEVEL_META[effectiveLevel];
  const nextMeta = (() => {
    const keys = Object.keys(LEVEL_META);
    const idx = keys.indexOf(effectiveLevel);
    return idx < keys.length - 1 ? LEVEL_META[keys[idx + 1] as keyof typeof LEVEL_META] : null;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-2xl border"
      style={{ borderColor: `${meta.color}25`, background: `linear-gradient(135deg, ${meta.color}07, transparent)` }}
    >
      <div className="absolute inset-x-0 top-0 h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${meta.color}60, transparent)` }} />
      <div
        className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full opacity-5"
        style={{ background: `radial-gradient(circle, ${meta.color}, transparent 70%)`, transform: "translate(30%, -30%)" }}
      />

      <div className="relative p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Level identity */}
          <div className="flex items-center gap-5">
            <motion.div
              className="relative flex-shrink-0"
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* Glow rings */}
              {[60, 50].map((size, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: size * 2,
                    height: size * 2,
                    top: "50%",
                    left: "50%",
                    marginLeft: -size,
                    marginTop: -size,
                    border: `1px solid ${meta.color}20`,
                  }}
                  animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2.5 + i, repeat: Infinity, delay: i * 0.4 }}
                />
              ))}
              <div
                className="relative flex h-20 w-20 items-center justify-center rounded-2xl text-4xl"
                style={{
                  background: `${meta.color}15`,
                  border: `1px solid ${meta.color}30`,
                  boxShadow: `0 0 30px ${meta.color}20`,
                }}
              >
                {meta.emoji}
              </div>
            </motion.div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-extrabold text-white">{meta.label}</h2>
                <span
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider"
                  style={{ background: `${meta.color}20`, color: meta.color, border: `1px solid ${meta.color}35` }}
                >
                  {meta.range}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-400">{meta.desc}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                <span className="text-slate-500">Wallet</span>
                <a
                  href={`https://solscan.io/account/${wallet}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-slate-400 hover:text-white transition-colors"
                >
                  {short(wallet)}
                </a>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
            <div
              className="rounded-xl p-3 text-center"
              style={{ background: `${meta.color}08`, border: `1px solid ${meta.color}18` }}
            >
              <div className="text-xl font-extrabold text-white">{totalPoints}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Points</div>
            </div>
            <div
              className="rounded-xl p-3 text-center"
              style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)" }}
            >
              <div className="text-xl font-extrabold text-white">
                {questsData ? `${questsData.claimed}/${questsData.total}` : "—"}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Quêtes</div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold" style={{ color: meta.color }}>{meta.label}</span>
            <span className="text-slate-500">
              {info.pointsToNext != null
                ? `${info.pointsToNext} pts → ${nextMeta?.label ?? "Max"}`
                : "Niveau maximum atteint"}
            </span>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-white/6">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ background: `linear-gradient(90deg, ${meta.color}, ${nextMeta?.color ?? meta.color}90)` }}
              initial={{ width: "0%" }}
              animate={{ width: `${info.progress}%` }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            />
            {/* Glow effect */}
            <motion.div
              className="absolute inset-y-0 w-8 rounded-full blur-sm opacity-70"
              style={{ background: meta.color, left: `calc(${info.progress}% - 16px)` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-600">
            <span>{info.currentMin}</span>
            <span>{info.nextMin ?? "∞"}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/** Section header component (same style as /explorer sections) */
function SectionHeader({
  tag,
  title,
  subtitle,
  icon,
}: {
  tag: string;
  title: React.ReactNode;
  subtitle?: string;
  icon?: string;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-xl">{icon}</span>}
        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">
          {tag}
        </span>
      </div>
      <h2 className="text-xl font-extrabold text-white sm:text-2xl">{title}</h2>
      {subtitle && <p className="mt-1.5 text-sm text-slate-400">{subtitle}</p>}
    </div>
  );
}

/** Session info compact */
function SessionCard({ exp, iat }: { exp: number; iat: number }) {
  const expDate = new Date(exp * 1000);
  const iatDate = new Date(iat * 1000);
  const isExpiringSoon = exp * 1000 - Date.now() < 30 * 60 * 1000; // 30min

  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/8 text-sm">
          🔐
        </div>
        <div>
          <div className="text-sm font-bold text-white">Session sécurisée</div>
          <div className="text-[10px] text-slate-500">Cookie httpOnly • Anti-replay</div>
        </div>
        <span className="ml-auto flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/8 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Session OK
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <div className="text-slate-500 mb-1">Connexion</div>
          <div className="font-semibold text-white/80">{iatDate.toLocaleTimeString()}</div>
        </div>
        <div>
          <div className="text-slate-500 mb-1">Expiration</div>
          <div className={`font-semibold ${isExpiringSoon ? "text-amber-300" : "text-white/80"}`}>
            {expDate.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {isExpiringSoon && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/6 px-3 py-2 text-xs text-amber-300">
          <span>⚠️</span>
          <span>Session expire bientôt — reconnecte-toi sur /community si nécessaire.</span>
        </div>
      )}
    </div>
  );
}

/** Links & resources sidebar card */
function ResourcesCard({ wallet }: { wallet: string }) {
  const links = [
    { label: "Explorer SHUI", href: "/explorer", icon: "🔍", desc: "Tokenomics, wallets, roadmap" },
    { label: "Solscan Token", href: SOCIALS.solscan, icon: "⛓️", desc: "Vérifier on-chain", external: true },
    { label: "Solscan Wallet", href: `https://solscan.io/account/${wallet}`, icon: "👛", desc: short(wallet), external: true },
    { label: "Telegram", href: SOCIALS.tg, icon: "💬", desc: "Communauté officielle", external: true },
    { label: "X / Twitter", href: SOCIALS.x, icon: "𝕏", desc: "@Shui_Labs", external: true },
    { label: "Instagram", href: SOCIALS.ig, icon: "📸", desc: "@shui.officialtoken", external: true },
  ];

  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-base">🔗</span>
        <span className="text-sm font-bold text-white">Ressources</span>
      </div>
      <div className="space-y-1.5">
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            target={l.external ? "_blank" : undefined}
            rel={l.external ? "noreferrer" : undefined}
            className="flex items-center gap-3 rounded-xl border border-transparent p-2.5 text-sm transition-all duration-200 hover:border-white/10 hover:bg-white/5"
          >
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-white/8 bg-white/4 text-sm">
              {l.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white">{l.label}</div>
              <div className="truncate text-[10px] text-slate-500">{l.desc}</div>
            </div>
            {l.external && <span className="text-[10px] text-slate-600">↗</span>}
          </a>
        ))}
      </div>
    </div>
  );
}

/** Rewards info card */
function RewardsSummaryCard() {
  const categories = [
    { label: "Quêtes & Missions", pct: "40%", shui: "6 000 000 SHUI", color: "#38bdf8" },
    { label: "Créateurs",          pct: "25%", shui: "3 750 000 SHUI", color: "#a78bfa" },
    { label: "Développeurs",       pct: "20%", shui: "3 000 000 SHUI", color: "#818cf8" },
    { label: "Initiatives",        pct: "10%", shui: "1 500 000 SHUI", color: "#34d399" },
    { label: "Événements",         pct: "5%",  shui: "750 000 SHUI",   color: "#f59e0b" },
  ];

  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-base">💰</span>
        <div>
          <div className="text-sm font-bold text-white">Distribution annuelle</div>
          <div className="text-[10px] text-slate-500">Plafond: 15 000 000 SHUI/an (5% du wallet Communauté)</div>
        </div>
      </div>
      <div className="space-y-2.5">
        {categories.map((c) => (
          <div key={c.label} className="flex items-center gap-3">
            <div className="flex h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: c.color }} />
            <div className="flex flex-1 items-center justify-between text-xs">
              <span className="text-slate-400">{c.label}</span>
              <div className="text-right">
                <span className="font-bold" style={{ color: c.color }}>{c.pct}</span>
                <span className="ml-1 text-slate-600">{c.shui}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 border-t border-white/6 pt-3">
        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
          <div>💧 <span className="text-white/70">25%</span> immédiat</div>
          <div>📈 <span className="text-white/70">75%</span> en vesting</div>
          <div>🔒 Max <span className="text-white/70">15 000 SHUI</span>/mois</div>
          <div>📋 Conversion mensuelle</div>
        </div>
      </div>
    </div>
  );
}

/** Transparency / Journal public placeholder */
function TransparencyCard() {
  const entries = [
    { date: "Mars 2026",  title: "Lancement infrastructure communautaire", type: "milestone", color: "#22d3ee" },
    { date: "Mars 2026",  title: "Système de quêtes v1 opérationnel",       type: "quests",    color: "#38bdf8" },
    { date: "À venir",    title: "Premier reporting mensuel public",         type: "reporting", color: "#a78bfa" },
    { date: "À venir",    title: "Distribution rewards — Epoch 1",          type: "rewards",   color: "#34d399" },
  ];
  const typeIcon: Record<string, string> = {
    milestone: "🚀", quests: "✨", reporting: "📊", rewards: "💧",
  };

  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">📋</span>
          <div>
            <div className="text-sm font-bold text-white">Journal public</div>
            <div className="text-[10px] text-slate-500">Transparence des décisions</div>
          </div>
        </div>
        <span className="rounded-full border border-cyan-500/25 bg-cyan-500/8 px-2 py-0.5 text-[10px] text-cyan-400">Live</span>
      </div>
      <div className="relative space-y-0">
        <div className="absolute bottom-2 left-[8px] top-2 w-[1px] bg-gradient-to-b from-cyan-500/30 via-indigo-500/15 to-transparent" />
        {entries.map((e, i) => (
          <div key={i} className="relative flex gap-4 pb-3">
            <div className="relative z-10 mt-1 flex-shrink-0">
              <div
                className="flex h-[18px] w-[18px] items-center justify-center rounded-full text-[9px]"
                style={{ background: `${e.color}20`, border: `1px solid ${e.color}40` }}
              >
                {typeIcon[e.type] ?? "•"}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-slate-600">{e.date}</div>
              <div className="text-xs text-slate-300 leading-tight">{e.title}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Navigation tabs for main content */
const TABS = [
  { id: "quests",   label: "Quêtes",    icon: "✨" },
  { id: "rewards",  label: "Rewards",   icon: "💰" },
  { id: "pool",     label: "Liquidité", icon: "⛓️" },
] as const;

type TabId = typeof TABS[number]["id"];

// ────────────────────────────────────────────────────────────
// Main Dashboard Page
// ────────────────────────────────────────────────────────────

export default function DashboardPage({ wallet, exp, iat }: Props) {
  const maintenanceActive = isDashboardMaintenanceEnabled();
  const maintenanceTitle = getMaintenanceTitle();
  const maintenanceMessage = getMaintenanceMessage();
  const maintenanceUntilLabel = getMaintenanceUntilLabel();
  const maintenanceActive = new Date() < DASHBOARD_MAINTENANCE_UNTIL;
  const { t } = useTranslation("common");
  const router = useRouter();
  const { connected, publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState<TabId>("quests");
  const [questsData, setQuestsData] = useState<{ total: number; claimed: number; totalPoints: number; forcedLevel?: string | null } | null>(null);

  // ── Security: wallet guard (unchanged from original) ──
  useEffect(() => {
    const w = publicKey?.toBase58() || "";
    if (!connected || !w) {
      logoutSession().finally(() => router.replace("/"));
      return;
    }
    if (wallet && w && wallet !== w) {
      logoutSession().finally(() => router.replace("/"));
    }
  }, [connected, publicKey, wallet, router]);

  // ── Load quest summary for hero card ──
  useEffect(() => {
    async function loadQuestSummary() {
      try {
        const r = await fetch("/api/quest/list");
        const j = await r.json();
        if (j.ok && Array.isArray(j.quests)) {
          const total = j.quests.length;
          const claimed = j.quests.filter((q: any) => q.claimed).length;
          const pts = j.points;
          const totalPoints = typeof pts === "number"
            ? pts
            : typeof pts?.total === "number"
            ? pts.total
            : 0;
          setQuestsData({ total, claimed, totalPoints, forcedLevel: j.forcedLevel ?? null });
        }
      } catch {
        // noop
      }
    }
    loadQuestSummary();
  }, []);

  const totalPoints = questsData?.totalPoints ?? 0;
  const forcedLevelFromWallet = getForcedQuestLevel(wallet);

  if (maintenanceActive) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#030712] text-white">
        <Head>
          <title>SHUI — Dashboard en maintenance</title>
          <meta name="description" content="Dashboard SHUI temporairement en maintenance." />
        </Head>

        <DashboardBackground />
        <DashboardNav wallet={wallet} t={t} />

        <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 pt-24 pb-16">
          <div className="w-full rounded-3xl border border-amber-500/20 bg-white/5 p-8 text-center backdrop-blur-xl">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-amber-400/20 bg-amber-500/10 text-4xl">
              🛠️
            </div>

            <div className="text-xs font-bold uppercase tracking-[0.28em] text-amber-300/90">
              Maintenance temporaire
            </div>

            <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">
              Dashboard SHUI en maintenance
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-300 sm:text-base">
              Nous effectuons une mise à jour du système de quêtes, de validation et de review.
              Le dashboard communautaire est temporairement indisponible pendant environ 72 heures.
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
              <div>
                Fin estimée : <span className="font-semibold text-white">{DASHBOARD_MAINTENANCE_UNTIL.toLocaleString("fr-FR")}</span>
              </div>
              <div className="mt-2 text-xs text-slate-400">
                Les pages publiques SHUI restent accessibles pendant cette période.
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="/explorer" passHref>
                <a className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-5 py-3 text-sm font-bold text-cyan-300 transition hover:bg-cyan-500/15">
                  Explorer SHUI
                </a>
              </Link>

              <Link href="/community" passHref>
                <a className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10">
                  Communauté
                </a>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-white" style={{ fontFamily: "-apple-system, 'Segoe UI', sans-serif" }}>
      <Head>
        <title>SHUI — Dashboard Communautaire</title>
        <meta name="description" content="Hub communautaire SHUI — Quêtes, récompenses, progression." />
      </Head>

      <DashboardBackground />
      <DashboardNav wallet={wallet} t={t} />

      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-20 pb-16 sm:px-6">

        {/* ── HERO — Level + Progress ── */}
        <section className="mt-6">
          <LevelHeroCard
            totalPoints={totalPoints}
            forcedLevel={forcedLevelFromWallet ?? questsData?.forcedLevel ?? null}
            wallet={wallet}
            questsData={questsData}
          />
        </section>

        {/* ── MAIN LAYOUT — 2 columns on lg ── */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">

          {/* ── LEFT: Main content ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Tab navigation */}
            <div className="flex items-center gap-1.5 rounded-2xl border border-white/8 bg-white/3 p-1.5">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition-all duration-300"
                  style={
                    activeTab === tab.id
                      ? {
                          background: "linear-gradient(135deg, rgba(56,189,248,0.2), rgba(99,102,241,0.15))",
                          border: "1px solid rgba(56,189,248,0.3)",
                          color: "#67e8f9",
                        }
                      : {
                          color: "rgba(148,163,184,1)",
                        }
                  }
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab content */}
            <AnimatePresence>
              {activeTab === "quests" && (
                <motion.div
                  key="quests"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                >
                  <SectionHeader
                    tag="Contribution"
                    title={
                      <>
                        Quêtes &{" "}
                        <span
                          style={{
                            background: "linear-gradient(135deg,#67e8f9,#a78bfa)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                          }}
                        >
                          Missions
                        </span>
                      </>
                    }
                    subtitle="Chaque quête validée contribue à la communauté et génère des points convertibles en SHUI."
                    icon="✨"
                  />
                  <QuestPanel />
                </motion.div>
              )}

              {activeTab === "rewards" && (
                <motion.div
                  key="rewards"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                >
                  <SectionHeader
                    tag="Distribution"
                    title={
                      <>
                        Rewards &{" "}
                        <span
                          style={{
                            background: "linear-gradient(135deg,#34d399,#38bdf8)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                          }}
                        >
                          Vesting
                        </span>
                      </>
                    }
                    subtitle="Points validés → conversion périodique en SHUI depuis le wallet Communauté."
                    icon="💰"
                  />
                  <RewardsPanel />
                </motion.div>
              )}

              {activeTab === "pool" && (
                <motion.div
                  key="pool"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                >
                  <SectionHeader
                    tag="Liquidité"
                    title={
                      <>
                        Pool Raydium{" "}
                        <span
                          style={{
                            background: "linear-gradient(135deg,#f59e0b,#38bdf8)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                          }}
                        >
                          SHUI/SOL
                        </span>
                      </>
                    }
                    subtitle="Informations sur le pool de liquidité. Toute action LP nécessite une transaction."
                    icon="⛓️"
                  />
                  <RaydiumPoolPanel />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <aside className="space-y-5">
            {/* Session card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <SessionCard exp={exp} iat={iat} />
            </motion.div>

            {/* Resources */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <ResourcesCard wallet={wallet} />
            </motion.div>

            {/* Rewards summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <RewardsSummaryCard />
            </motion.div>

            {/* Journal public */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <TransparencyCard />
            </motion.div>

            {/* Mobile sync teaser */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="rounded-2xl border border-white/8 bg-white/2 p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/6 text-xl">
                  📱
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Application mobile</div>
                  <div className="text-[10px] text-slate-500">Sync web ↔ mobile</div>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ton compte, tes points, tes quêtes et ton historique seront synchronisés en temps réel avec l&apos;application mobile SHUI.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Link href="/download" passHref>
                <a
                  className="flex items-center gap-1.5 rounded-xl border border-cyan-500/20 bg-cyan-500/6 px-3 py-1.5 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/12 transition-colors"
                >
                  📥 Télécharger APK
                </a>
                </Link>
                <span className="rounded-full border border-white/8 bg-white/4 px-2 py-0.5 text-[10px] text-slate-500">Beta</span>
              </div>
            </motion.div>

            {/* Security reminder */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="rounded-2xl border border-amber-500/12 bg-amber-500/4 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">🛡️</span>
                <span className="text-xs font-bold text-white">Sécurité</span>
              </div>
              <ul className="space-y-1 text-[10px] text-slate-400">
                <li className="flex items-start gap-1.5"><span className="text-emerald-400 flex-shrink-0">✓</span> Connexion = signature message (gratuit)</li>
                <li className="flex items-start gap-1.5"><span className="text-emerald-400 flex-shrink-0">✓</span> Nonce unique anti-replay</li>
                <li className="flex items-start gap-1.5"><span className="text-emerald-400 flex-shrink-0">✓</span> Cookie httpOnly sécurisé</li>
                <li className="flex items-start gap-1.5"><span className="text-amber-400 flex-shrink-0">⚠</span> Swap = transaction (normal, visible dans Phantom)</li>
              </ul>
            </motion.div>
          </aside>
        </div>

        {/* ── FOOTER BOTTOM ── */}
        <footer className="mt-16 border-t border-white/6 pt-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="relative h-6 w-6 overflow-hidden rounded-full ring-1 ring-white/15">
              <Image src="/shui-token.png" alt="SHUI" layout="fill" objectFit="cover" />
            </div>
            <span className="text-xs font-extrabold tracking-wider text-white">SHUI</span>
          </div>
          <p className="text-xs text-slate-600">
            &ldquo;Nous sommes des gouttes. Ensemble, nous formons un océan.&rdquo;
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            {[
              { label: "Explorer", href: "/explorer" },
              { label: "Communauté", href: "/community" },
              { label: "Solscan", href: SOCIALS.solscan, external: true },
              { label: "Telegram", href: SOCIALS.tg, external: true },
              { label: "X", href: SOCIALS.x, external: true },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                target={l.external ? "_blank" : undefined}
                rel={l.external ? "noreferrer" : undefined}
                className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>
          <p className="mt-4 text-[10px] text-slate-700">
            © 2026 SHUI — Infrastructure Communautaire sur Solana
          </p>
        </footer>
      </div>
    </div>
  );
}
