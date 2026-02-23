export const REWARDS = {
  // Pool SHUI "théorique" distribué par epoch (V1 off-chain)
  poolShui: Number(process.env.REWARDS_POOL_SHUI || 100000),

  // Durée d’un epoch en jours (mensuel = 30)
  epochDays: Number(process.env.REWARDS_EPOCH_DAYS || 30),

  // Seuil minimum de points (anti-bot)
  minPoints: Number(process.env.REWARDS_MIN_POINTS || 10),
};

export function getEpochWindow(nowMs = Date.now()) {
  const days = REWARDS.epochDays;
  const epochMs = days * 24 * 60 * 60 * 1000;

  // Ancre stable UTC
  const anchor = Date.UTC(2026, 0, 1, 0, 0, 0, 0);

  const n = Math.floor((nowMs - anchor) / epochMs);
  const start = anchor + n * epochMs;
  const end = start + epochMs;

  return { start, end, epochId: `E${days}d-${n}` };
}
