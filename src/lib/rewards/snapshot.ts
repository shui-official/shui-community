import { getAllWalletPoints, getCurrentMonthKey } from "../quests/store";
import { roundShuiAmount, splitImmediateAndVesting } from "./rounding";
import { buildWalletValidationRecord, normalizeRewardWallet } from "./walletValidation";
import type { RewardMonthlySnapshot, RewardPeriod, WalletValidationRecord } from "./types";

export type SnapshotSourceRow = {
  wallet: string;
  activityPoints: number;
  onchainPoints: number;
  reviewPoints: number;
  totalPoints: number;
};

export type SnapshotBuildInput = {
  period: RewardPeriod;
  snapshotDate?: string;
  conversionRatio: number;
  rows: SnapshotSourceRow[];
};

export type SnapshotBuildResult = {
  period: RewardPeriod;
  snapshotDate: string;
  conversionRatio: number;
  snapshots: RewardMonthlySnapshot[];
  walletValidations: WalletValidationRecord[];
};

function nowIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function makeSnapshotId(period: RewardPeriod, wallet: string): string {
  return `snapshot:${period}:${wallet}`;
}

function makeWalletValidationId(period: RewardPeriod, wallet: string): string {
  return `wallet-validation:${period}:${wallet}`;
}

export function getSnapshotSourceRowsFromQuestStore(period?: RewardPeriod): SnapshotSourceRow[] {
  const sourcePeriod = period ?? (getCurrentMonthKey() as RewardPeriod);
  const all = getAllWalletPoints(sourcePeriod);

  return all.map((entry) => {
    const activityPoints = Number(entry.points?.activity ?? 0);
    const onchainPoints = Number(entry.points?.onchain ?? 0);
    const reviewPoints = 0;
    const totalPoints = Number(activityPoints + onchainPoints + reviewPoints);

    return {
      wallet: entry.wallet,
      activityPoints,
      onchainPoints,
      reviewPoints,
      totalPoints,
    };
  });
}

export function buildMonthlySnapshots(input: SnapshotBuildInput): SnapshotBuildResult {
  const snapshotDate = input.snapshotDate ?? nowIsoDate();

  const walletValidations: WalletValidationRecord[] = [];
  const snapshots: RewardMonthlySnapshot[] = input.rows.map((row) => {
    const walletNormalized = normalizeRewardWallet(row.wallet);

    const validation = buildWalletValidationRecord({
      id: makeWalletValidationId(input.period, walletNormalized || "missing"),
      wallet: row.wallet,
    });

    walletValidations.push(validation);

    const totalShui = roundShuiAmount(row.totalPoints * input.conversionRatio);
    const split = splitImmediateAndVesting(totalShui);

    return {
      id: makeSnapshotId(input.period, walletNormalized || "missing"),
      period: input.period,
      snapshotDate,
      wallet: row.wallet,
      walletNormalized,

      walletValidationStatus: validation.status,
      walletValidationReason: validation.reason,

      activityPoints: row.activityPoints,
      onchainPoints: row.onchainPoints,
      reviewPoints: row.reviewPoints,
      totalPoints: row.totalPoints,

      conversionRatio: input.conversionRatio,

      totalShui: split.totalShui,
      immediateShui: split.immediateShui,
      vestingShui: split.vestingShui,

      roundingRemainder: roundShuiAmount(split.totalShui - split.immediateShui - split.vestingShui),

      status: validation.isValid ? "draft" : "blocked",

      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  });

  return {
    period: input.period,
    snapshotDate,
    conversionRatio: input.conversionRatio,
    snapshots,
    walletValidations,
  };
}

export function buildMonthlySnapshotsFromQuestStore(params: {
  period?: RewardPeriod;
  conversionRatio: number;
  snapshotDate?: string;
}): SnapshotBuildResult {
  const period = params.period ?? (getCurrentMonthKey() as RewardPeriod);
  const rows = getSnapshotSourceRowsFromQuestStore(period);

  return buildMonthlySnapshots({
    period,
    snapshotDate: params.snapshotDate,
    conversionRatio: params.conversionRatio,
    rows,
  });
}

export {};
