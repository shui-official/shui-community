import type { PointsBreakdown } from "../quests/store";

export type RewardConfig = {
  pointToShui: number;          // repère UI: 1 point = 10 SHUI
  poolMonthlyShui: number;      // pool fixe/mois
  maxPointsPerWallet: number;   // plafond points éligibles / wallet / mois

  // séparation activity vs onchain
  onchainWeight: number;        // ex 0.35 -> on ne compte que 35% des points onchain
  onchainMaxPoints: number;     // cap points onchain pris en compte dans l’éligible
};

export type WalletRewardInput = {
  wallet: string;
  points: PointsBreakdown;
};

export type WalletRewardOutput = {
  wallet: string;

  // points bruts
  activityPoints: number;
  onchainPoints: number;
  totalPoints: number;

  // points éligibles (après weight/caps)
  eligiblePoints: number;

  // estimations
  estimatedShuiIfLinear: number; // eligiblePoints * pointToShui (repère)
  poolShare: number;             // % de pool
  estimatedShuiFromPool: number; // allocation réelle (pool)
};

export function getRewardConfigFromEnv(): RewardConfig {
  const pointToShui = Number(process.env.REWARDS_POINT_TO_SHUI || 10);
  const poolMonthlyShui = Number(process.env.REWARDS_POOL_SHUI_MONTHLY || 1_000_000);
  const maxPointsPerWallet = Number(process.env.REWARDS_MAX_POINTS_PER_WALLET || 5_000);

  const onchainWeight = Number(process.env.REWARDS_ONCHAIN_WEIGHT || 0.35);
  const onchainMaxPoints = Number(process.env.REWARDS_ONCHAIN_MAX_POINTS || 2_500);

  return {
    pointToShui,
    poolMonthlyShui,
    maxPointsPerWallet,
    onchainWeight,
    onchainMaxPoints,
  };
}

export function computeEligiblePoints(p: PointsBreakdown, cfg: RewardConfig): number {
  const activity = Math.max(0, Number(p.activity || 0));
  const onchainRaw = Math.max(0, Number(p.onchain || 0));

  // cap onchain
  const onchainCapped = Math.min(onchainRaw, cfg.onchainMaxPoints);

  // weight onchain
  const onchainWeighted = onchainCapped * cfg.onchainWeight;

  // eligible = activity + weighted onchain
  const eligible = activity + onchainWeighted;

  // cap global par wallet
  return Math.min(eligible, cfg.maxPointsPerWallet);
}

export function computeMonthlyPoolDistribution(inputs: WalletRewardInput[], cfg: RewardConfig): WalletRewardOutput[] {
  const outputs: WalletRewardOutput[] = inputs.map((w) => {
    const eligible = computeEligiblePoints(w.points, cfg);
    return {
      wallet: w.wallet,
      activityPoints: w.points.activity,
      onchainPoints: w.points.onchain,
      totalPoints: w.points.total,
      eligiblePoints: eligible,
      estimatedShuiIfLinear: Math.floor(eligible * cfg.pointToShui),
      poolShare: 0,
      estimatedShuiFromPool: 0,
    };
  });

  const sumEligible = outputs.reduce((a, o) => a + o.eligiblePoints, 0);

  // si personne n’a de points éligibles
  if (sumEligible <= 0) return outputs;

  for (const o of outputs) {
    const share = o.eligiblePoints / sumEligible;
    o.poolShare = share;
    o.estimatedShuiFromPool = Math.floor(cfg.poolMonthlyShui * share);
  }

  return outputs;
}
