type WalletRewardState = {
  claimedEpochs: Set<string>;
  totalClaimedShui: number;
  updatedAt: number;
};

const rewardsByWallet = new Map<string, WalletRewardState>();

function getOrCreate(wallet: string): WalletRewardState {
  const existing = rewardsByWallet.get(wallet);
  if (existing) return existing;

  const fresh: WalletRewardState = { claimedEpochs: new Set(), totalClaimedShui: 0, updatedAt: Date.now() };
  rewardsByWallet.set(wallet, fresh);
  return fresh;
}

export function hasClaimedEpoch(wallet: string, epochId: string): boolean {
  return getOrCreate(wallet).claimedEpochs.has(epochId);
}

export function claimEpoch(wallet: string, epochId: string, amountShui: number) {
  const s = getOrCreate(wallet);

  if (s.claimedEpochs.has(epochId)) {
    return { ok: true as const, alreadyClaimed: true as const, totalClaimedShui: s.totalClaimedShui };
  }

  s.claimedEpochs.add(epochId);
  s.totalClaimedShui += Math.max(0, Math.floor(amountShui));
  s.updatedAt = Date.now();
  rewardsByWallet.set(wallet, s);

  return { ok: true as const, alreadyClaimed: false as const, totalClaimedShui: s.totalClaimedShui };
}

export function getRewardSnapshot(wallet: string) {
  const s = getOrCreate(wallet);
  return {
    wallet,
    claimedEpochs: Array.from(s.claimedEpochs),
    totalClaimedShui: s.totalClaimedShui,
    updatedAt: s.updatedAt,
  };
}
