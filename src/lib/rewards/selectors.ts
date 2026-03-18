import { rewardsRepository } from "./store/repository";
import { getCurrentRewardPeriod } from "./period";
import { normalizeRewardWallet } from "./walletValidation";
import type { RewardPeriod } from "./types";

export const USER_MONTHLY_CAP_SHUI = 15000;

export type UserRewardsUpcomingUnlock = {
  installmentId: string;
  unlockPeriod: RewardPeriod;
  unlockDate: string;
  plannedAmount: number;
};

export type UserRewardsSummary = {
  wallet: string;
  walletNormalized: string;

  personalTotalShui: number;
  personalImmediateShui: number;
  personalVestingTotalShui: number;
  personalVestingCompletedShui: number;
  personalVestingRemainingShui: number;

  personalNextUnlockDate: string | null;
  personalNextUnlockAmount: number;
  personalRemainingInstallmentsCount: number;

  monthlyPeriod: RewardPeriod;
  monthlyCapShui: number;
  monthlyDistributedShui: number;
  monthlyRemainingShui: number;
  monthlyUsedPercent: number;

  upcomingUnlocks: UserRewardsUpcomingUnlock[];

  calculationMode: {
    monthlyDistributedBasedOn: "completed";
    vestingCompletedBasedOn: "completed_ledger";
  };
};

function round9(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 1_000_000_000) / 1_000_000_000;
}

function sum(values: number[]): number {
  return round9(values.reduce((acc, value) => acc + value, 0));
}

export function getUserRewardsSummary(
  wallet: string,
  options?: { monthlyPeriod?: RewardPeriod; upcomingLimit?: number }
): UserRewardsSummary {
  const walletNormalized = normalizeRewardWallet(wallet);
  const monthlyPeriod = options?.monthlyPeriod ?? getCurrentRewardPeriod();
  const upcomingLimit = Math.max(1, Math.min(6, Number(options?.upcomingLimit ?? 4)));

  const snapshots = rewardsRepository
    .getSnapshots()
    .filter((item) => item.walletNormalized === walletNormalized)
    .filter((item) => item.walletValidationStatus === "valid")
    .filter((item) => item.status !== "blocked");

  const schedules = rewardsRepository
    .getVestingSchedules()
    .filter((item) => item.walletNormalized === walletNormalized)
    .filter((item) => item.status !== "blocked" && item.status !== "cancelled");

  const installments = rewardsRepository
    .getVestingInstallments()
    .filter((item) => item.walletNormalized === walletNormalized)
    .filter((item) => item.status !== "blocked")
    .sort((a, b) => {
      const byDate = a.unlockDate.localeCompare(b.unlockDate);
      if (byDate !== 0) return byDate;
      return a.installmentIndex - b.installmentIndex;
    });

  const ledger = rewardsRepository.getDistributionLedger();

  const completedVestingLedger = ledger
    .filter((item) => item.walletNormalized === walletNormalized)
    .filter((item) => item.entryType === "vesting")
    .filter((item) => item.status === "completed");

  const completedInstallmentIds = new Set(
    completedVestingLedger
      .map((item) => item.sourceInstallmentId)
      .filter((value): value is string => Boolean(value))
  );

  const remainingInstallments = installments.filter(
    (item) => !completedInstallmentIds.has(item.id)
  );

  const nextUnlock = remainingInstallments[0] ?? null;

  const personalImmediateShui = sum(snapshots.map((item) => item.immediateShui));
  const personalVestingTotalShui = sum(
    schedules.length > 0
      ? schedules.map((item) => item.totalVestingShui)
      : snapshots.map((item) => item.vestingShui)
  );

  const personalVestingCompletedShui = sum(
    completedVestingLedger.map((item) => item.amountSent || item.amountPlanned)
  );

  const personalVestingRemainingShui = round9(
    Math.max(0, personalVestingTotalShui - personalVestingCompletedShui)
  );

  const personalTotalShui = round9(
    personalImmediateShui + personalVestingTotalShui
  );

  const monthlyCompletedLedger = rewardsRepository
    .getDistributionLedgerByPayablePeriod(monthlyPeriod)
    .filter((item) => item.status === "completed");

  const monthlyDistributedShui = sum(
    monthlyCompletedLedger.map((item) => item.amountSent || item.amountPlanned)
  );

  const monthlyRemainingShui = round9(
    Math.max(0, USER_MONTHLY_CAP_SHUI - monthlyDistributedShui)
  );

  const monthlyUsedPercent =
    USER_MONTHLY_CAP_SHUI > 0
      ? Math.max(
          0,
          Math.min(
            100,
            round9((monthlyDistributedShui / USER_MONTHLY_CAP_SHUI) * 100)
          )
        )
      : 0;

  return {
    wallet,
    walletNormalized,

    personalTotalShui,
    personalImmediateShui,
    personalVestingTotalShui,
    personalVestingCompletedShui,
    personalVestingRemainingShui,

    personalNextUnlockDate: nextUnlock?.unlockDate ?? null,
    personalNextUnlockAmount: round9(nextUnlock?.plannedAmount ?? 0),
    personalRemainingInstallmentsCount: remainingInstallments.length,

    monthlyPeriod,
    monthlyCapShui: USER_MONTHLY_CAP_SHUI,
    monthlyDistributedShui,
    monthlyRemainingShui,
    monthlyUsedPercent,

    upcomingUnlocks: remainingInstallments.slice(0, upcomingLimit).map((item) => ({
      installmentId: item.id,
      unlockPeriod: item.unlockPeriod,
      unlockDate: item.unlockDate,
      plannedAmount: round9(item.plannedAmount),
    })),

    calculationMode: {
      monthlyDistributedBasedOn: "completed",
      vestingCompletedBasedOn: "completed_ledger",
    },
  };
}

export {};
