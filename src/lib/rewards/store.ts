type EpochClaims = Set<string>;

// In-memory store (MVP)
// epochId -> set(wallets who claimed)
const claimedByEpoch = new Map<string, EpochClaims>();

// Optional: reward snapshots per wallet (placeholder for now)
const rewardSnapshotByWallet = new Map<string, { totalClaimedShui: number }>();

function normWallet(w: string) {
  return (w || "").trim();
}

// --- New API (already used by claim.ts) ---
export function hasClaimed(epochId: string, wallet: string): boolean {
  const w = normWallet(wallet);
  if (!epochId || !w) return false;
  const set = claimedByEpoch.get(epochId);
  return Boolean(set && set.has(w));
}

export function markClaimed(epochId: string, wallet: string): void {
  const w = normWallet(wallet);
  if (!epochId || !w) return;

  let set = claimedByEpoch.get(epochId);
  if (!set) {
    set = new Set<string>();
    claimedByEpoch.set(epochId, set);
  }
  set.add(w);

  // keep snapshot entry initialized
  if (!rewardSnapshotByWallet.has(w)) rewardSnapshotByWallet.set(w, { totalClaimedShui: 0 });
}

// --- Compat aliases (older code expects these names) ---
export function hasClaimedEpoch(wallet: string, epochId: string): boolean {
  return hasClaimed(epochId, wallet);
}

export function setClaimed(epochId: string, wallet: string): void {
  markClaimed(epochId, wallet);
}

export function isClaimed(epochId: string, wallet: string): boolean {
  return hasClaimed(epochId, wallet);
}

// Rewards snapshot (historical)
// For now, totalClaimedShui stays 0 until distribution is wired.
export function getRewardSnapshot(wallet: string): { totalClaimedShui: number } {
  const w = normWallet(wallet);
  return rewardSnapshotByWallet.get(w) || { totalClaimedShui: 0 };
}

// Debug helpers (optional)
export function getClaimedWallets(epochId: string): string[] {
  return Array.from(claimedByEpoch.get(epochId) || []);
}

export function resetEpoch(epochId: string): void {
  claimedByEpoch.delete(epochId);
}
