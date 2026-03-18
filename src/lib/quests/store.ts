import fs from "fs";
import path from "path";
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
  bonusAwarded: Set<string>;
  points: PointsBreakdown;
  updatedAt: number;
};

type PersistedWalletClaims = {
  claimed: ClaimRecord[];
  bonusAwarded: string[];
  points: PointsBreakdown;
  updatedAt: number;
};

type PersistedClaimsByMonth = Record<string, Record<string, PersistedWalletClaims>>;

type ClaimsStoreState = {
  claimsByMonth: Map<string, Map<string, WalletClaims>>;
  isLoaded: boolean;
};

declare global {
  // eslint-disable-next-line no-var
  var __shuiQuestStore__: ClaimsStoreState | undefined;
}

const storeState: ClaimsStoreState =
  globalThis.__shuiQuestStore__ ??
  (globalThis.__shuiQuestStore__ = {
    claimsByMonth: new Map<string, Map<string, WalletClaims>>(),
    isLoaded: false,
  });

const claimsByMonth = storeState.claimsByMonth;

const DATA_DIR = path.join(process.cwd(), "data", "quests");
const DATA_FILE = path.join(DATA_DIR, "monthly-claims.json");

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

function ensureDataFile() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "{}\n", "utf8");
  }
}

function toPlainWalletClaims(wc: WalletClaims): PersistedWalletClaims {
  return {
    claimed: Array.from(wc.claimed.values()),
    bonusAwarded: Array.from(wc.bonusAwarded.values()),
    points: {
      activity: Number(wc.points.activity || 0),
      onchain: Number(wc.points.onchain || 0),
      total: Number(wc.points.total || 0),
    },
    updatedAt: Number(wc.updatedAt || Date.now()),
  };
}

function fromPlainWalletClaims(raw?: PersistedWalletClaims | null): WalletClaims {
  const claimedRecords = Array.isArray(raw?.claimed) ? raw!.claimed : [];
  const bonusAwarded = Array.isArray(raw?.bonusAwarded) ? raw!.bonusAwarded : [];
  const activity = Number(raw?.points?.activity || 0);
  const onchain = Number(raw?.points?.onchain || 0);
  const total = Number(raw?.points?.total || activity + onchain);

  return {
    claimed: new Map(claimedRecords.map((rec) => [rec.questId, rec])),
    bonusAwarded: new Set(bonusAwarded),
    points: {
      activity,
      onchain,
      total,
    },
    updatedAt: Number(raw?.updatedAt || Date.now()),
  };
}

function loadFromDisk() {
  if (storeState.isLoaded) return;

  ensureDataFile();

  const raw = fs.readFileSync(DATA_FILE, "utf8").trim();
  const parsed: PersistedClaimsByMonth = raw ? JSON.parse(raw) : {};

  claimsByMonth.clear();

  for (const [mk, wallets] of Object.entries(parsed)) {
    const monthMap = new Map<string, WalletClaims>();

    for (const [wallet, walletClaims] of Object.entries(wallets || {})) {
      monthMap.set(wallet, fromPlainWalletClaims(walletClaims));
    }

    claimsByMonth.set(mk, monthMap);
  }

  storeState.isLoaded = true;
}

function saveToDisk() {
  ensureDataFile();

  const plain: PersistedClaimsByMonth = {};

  for (const [mk, walletMap] of claimsByMonth.entries()) {
    plain[mk] = {};

    for (const [wallet, walletClaims] of walletMap.entries()) {
      plain[mk][wallet] = toPlainWalletClaims(walletClaims);
    }
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(plain, null, 2) + "\n", "utf8");
}

function getMonthMap(mk: string) {
  loadFromDisk();

  let mm = claimsByMonth.get(mk);
  if (!mm) {
    mm = new Map<string, WalletClaims>();
    claimsByMonth.set(mk, mm);
    saveToDisk();
  }
  return mm;
}

export function getOrCreateWalletClaims(wallet: string, mk = monthKey()): WalletClaims {
  const mm = getMonthMap(mk);
  const existing = mm.get(wallet);
  if (existing) return existing;

  const fresh: WalletClaims = {
    claimed: new Map(),
    bonusAwarded: new Set(),
    points: { activity: 0, onchain: 0, total: 0 },
    updatedAt: Date.now(),
  };

  mm.set(wallet, fresh);
  saveToDisk();
  return fresh;
}

export function hasClaimed(wallet: string, quest: Quest, mk = monthKey()): boolean {
  const wc = getOrCreateWalletClaims(wallet, mk);
  const rec = wc.claimed.get(quest.id);
  if (!rec) return false;

  if (quest.cooldown === "once") return true;

  const today = startOfDayMs(Date.now());
  const claimedDay = startOfDayMs(rec.claimedAt);
  return claimedDay === today;
}

export function claimQuest(wallet: string, quest: Quest, pointsToAward: number, mk = monthKey()) {
  const wc = getOrCreateWalletClaims(wallet, mk);

  if (hasClaimed(wallet, quest, mk)) {
    return { ok: true as const, alreadyClaimed: true as const, points: wc.points };
  }

  const verif = String(quest.verification ?? "");
  const bucket: "activity" | "onchain" =
    (verif === "onchain-hold" || verif === "onchain-lp" ||
     verif === "auto-onchain-hold" || verif === "auto-onchain-lp")
      ? "onchain"
      : "activity";

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
  saveToDisk();

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

export function awardActivityPoints(wallet: string, awardKey: string, pointsToAward: number, mk = monthKey()) {
  const wc = getOrCreateWalletClaims(wallet, mk);

  if (!Number.isFinite(pointsToAward) || pointsToAward <= 0) {
    return { ok: true as const, alreadyAwarded: false as const, points: wc.points };
  }

  if (wc.bonusAwarded.has(awardKey)) {
    return { ok: true as const, alreadyAwarded: true as const, points: wc.points };
  }

  wc.bonusAwarded.add(awardKey);
  wc.points.activity += pointsToAward;
  wc.points.total = wc.points.activity + wc.points.onchain;
  wc.updatedAt = Date.now();

  const mm = getMonthMap(mk);
  mm.set(wallet, wc);
  saveToDisk();

  return { ok: true as const, alreadyAwarded: false as const, points: wc.points };
}

export function resetWalletClaimsForMonth(wallet: string, mk = monthKey()) {
  const mm = getMonthMap(mk);

  const fresh: WalletClaims = {
    claimed: new Map(),
    bonusAwarded: new Set(),
    points: { activity: 0, onchain: 0, total: 0 },
    updatedAt: Date.now(),
  };

  mm.set(wallet, fresh);
  saveToDisk();

  return fresh;
}

export function setWalletPointsForMonth(
  wallet: string,
  input: { activity: number; onchain: number },
  mk = monthKey()
) {
  const mm = getMonthMap(mk);
  const wc = getOrCreateWalletClaims(wallet, mk);

  wc.points.activity = Number(input.activity || 0);
  wc.points.onchain = Number(input.onchain || 0);
  wc.points.total = wc.points.activity + wc.points.onchain;
  wc.updatedAt = Date.now();

  mm.set(wallet, wc);
  saveToDisk();

  return wc;
}
