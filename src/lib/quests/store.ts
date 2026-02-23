import type { Quest } from "./catalog";

export type PointsBreakdown = {
  activity: number; // daily/social/learn/community
  onchain: number;  // holder/lp
  total: number;    // activity + onchain
};

type ClaimRecord = {
  questId: string;
  claimedAt: number; // ms
  pointsAwarded: number;
  bucket: "activity" | "onchain";
};

type WalletClaims = {
  claimed: Map<string, ClaimRecord>;
  points: PointsBreakdown;
  updatedAt: number;
};

// 👉 Stockage par mois (YYYY-MM) pour un système “mensuel”
const claimsByMonth = new Map<string, Map<string, WalletClaims>>();

function monthKey(ts = Date.now()) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function startOfDayMs(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function getMonthMap(mk: string) {
  let mm = claimsByMonth.get(mk);
  if (!mm) {
    mm = new Map<string, WalletClaims>();
    claimsByMonth.set(mk, mm);
  }
  return mm;
}

export function getOrCreateWalletClaims(wallet: string, mk = monthKey()): WalletClaims {
  const mm = getMonthMap(mk);
  const existing = mm.get(wallet);
  if (existing) return existing;

  const fresh: WalletClaims = {
    claimed: new Map(),
    points: { activity: 0, onchain: 0, total: 0 },
    updatedAt: Date.now(),
  };
  mm.set(wallet, fresh);
  return fresh;
}

export function hasClaimed(wallet: string, quest: Quest, mk = monthKey()): boolean {
  const wc = getOrCreateWalletClaims(wallet, mk);
  const rec = wc.claimed.get(quest.id);
  if (!rec) return false;

  if (quest.cooldown === "once") return true;

  // daily
  const today = startOfDayMs(Date.now());
  const claimedDay = startOfDayMs(rec.claimedAt);
  return claimedDay === today;
}

export function claimQuest(wallet: string, quest: Quest, pointsToAward: number, mk = monthKey()) {
  const wc = getOrCreateWalletClaims(wallet, mk);

  if (hasClaimed(wallet, quest, mk)) {
    return { ok: true as const, alreadyClaimed: true as const, points: wc.points };
  }

  const bucket: "activity" | "onchain" = quest.kind === "onchain" ? "onchain" : "activity";

  const rec: ClaimRecord = {
    questId: quest.id,
    claimedAt: Date.now(),
    pointsAwarded: pointsToAward,
    bucket,
  };

  wc.claimed.set(quest.id, rec);

  if (bucket === "onchain") wc.points.onchain += pointsToAward;
  else wc.points.activity += pointsToAward;

  wc.points.total = wc.points.activity + wc.points.onchain;
  wc.updatedAt = Date.now();

  const mm = getMonthMap(mk);
  mm.set(wallet, wc);

  return { ok: true as const, alreadyClaimed: false as const, points: wc.points };
}

export function getClaimsSnapshot(wallet: string, mk = monthKey()) {
  const wc = getOrCreateWalletClaims(wallet, mk);
  return {
    month: mk,
    wallet,
    points: wc.points,
    claimedIds: Array.from(wc.claimed.keys()),
    updatedAt: wc.updatedAt,
    claims: Array.from(wc.claimed.values()),
  };
}

export function getAllWalletPoints(mk = monthKey()): Array<{ wallet: string; points: PointsBreakdown }> {
  const mm = getMonthMap(mk);
  return Array.from(mm.entries()).map(([wallet, wc]) => ({
    wallet,
    points: wc.points,
  }));
}

export function getCurrentMonthKey() {
  return monthKey();
}
