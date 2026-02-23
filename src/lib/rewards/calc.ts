import { REWARDS, getEpochWindow } from "./config";
import { getAllWalletPoints } from "../quests/store";

export type Allocation = {
  wallet: string;
  points: number;
  amountShui: number;
};

export function computeMonthlyAllocations(nowMs = Date.now()) {
  const { epochId, start, end } = getEpochWindow(nowMs);

  const all = getAllWalletPoints();
  const eligible = all
    .filter((x) => x.points >= REWARDS.minPoints)
    .filter((x) => x.wallet && x.wallet.length > 10);

  const totalPoints = eligible.reduce((sum, x) => sum + x.points, 0);

  const allocations: Allocation[] =
    totalPoints > 0
      ? eligible
          .map((x) => ({
            wallet: x.wallet,
            points: x.points,
            amountShui: Math.floor((x.points / totalPoints) * REWARDS.poolShui),
          }))
          .sort((a, b) => b.amountShui - a.amountShui)
      : [];

  const totalDistributed = allocations.reduce((sum, a) => sum + a.amountShui, 0);
  const remainder = Math.max(0, REWARDS.poolShui - totalDistributed);

  return {
    epochId,
    epochStart: start,
    epochEnd: end,
    poolShui: REWARDS.poolShui,
    minPoints: REWARDS.minPoints,
    totalEligibleWallets: eligible.length,
    totalEligiblePoints: totalPoints,
    totalDistributed,
    remainder,
    allocations,
  };
}

export function toCsv(rows: Allocation[], epochId: string) {
  const header = "epoch_id,wallet,points,amount_shui";
  const lines = rows.map((r) => [epochId, r.wallet, r.points, r.amountShui].join(","));
  return [header, ...lines].join("\n") + "\n";
}
