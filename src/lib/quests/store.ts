import type { Quest } from "./catalog";

type WalletClaims = {
  claimed: Set<string>;
  points: number;
  updatedAt: number;
};

const claimsByWallet = new Map<string, WalletClaims>();

export function getOrCreateWalletClaims(wallet: string): WalletClaims {
  const existing = claimsByWallet.get(wallet);
  if (existing) return existing;

  const fresh: WalletClaims = { claimed: new Set(), points: 0, updatedAt: Date.now() };
  claimsByWallet.set(wallet, fresh);
  return fresh;
}

export function hasClaimed(wallet: string, questId: string): boolean {
  return getOrCreateWalletClaims(wallet).claimed.has(questId);
}

export function claimQuest(wallet: string, quest: Quest) {
  const wc = getOrCreateWalletClaims(wallet);

  // idempotent
  if (wc.claimed.has(quest.id)) {
    return { ok: true as const, alreadyClaimed: true as const, points: wc.points };
  }

  wc.claimed.add(quest.id);
  wc.points += quest.points;
  wc.updatedAt = Date.now();
  claimsByWallet.set(wallet, wc);

  return { ok: true as const, alreadyClaimed: false as const, points: wc.points };
}

export function getClaimsSnapshot(wallet: string) {
  const wc = getOrCreateWalletClaims(wallet);
  return {
    wallet,
    points: wc.points,
    claimedIds: Array.from(wc.claimed),
    updatedAt: wc.updatedAt,
  };
}

// ✅ utilisé par Rewards : total points des wallets
export function getAllWalletPoints(): Array<{ wallet: string; points: number }> {
  return Array.from(claimsByWallet.entries()).map(([wallet, wc]) => ({
    wallet,
    points: wc.points,
  }));
}
