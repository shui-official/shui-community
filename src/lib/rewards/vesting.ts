import { REWARDS_VESTING_MONTHS } from "./constants";
import { addMonthsToRewardPeriod } from "./period";
import { buildVestingInstallments } from "./rounding";
import type {
  RewardMonthlySnapshot,
  RewardPeriod,
  VestingSchedule,
  VestingScheduleInstallment,
} from "./types";

export type VestingBuildResult = {
  sourcePeriod: RewardPeriod;
  schedules: VestingSchedule[];
  installments: VestingScheduleInstallment[];
};

function makeScheduleId(sourcePeriod: RewardPeriod, walletNormalized: string): string {
  return `vesting-schedule:${sourcePeriod}:${walletNormalized}`;
}

function makeInstallmentId(
  sourcePeriod: RewardPeriod,
  walletNormalized: string,
  installmentIndex: number
): string {
  return `vesting-installment:${sourcePeriod}:${walletNormalized}:${installmentIndex}`;
}

function nowTs(): number {
  return Date.now();
}

function toUnlockDate(period: RewardPeriod): string {
  return `${period}-01`;
}

export function buildVestingFromSnapshots(params: {
  sourcePeriod: RewardPeriod;
  snapshots: RewardMonthlySnapshot[];
}): VestingBuildResult {
  const schedules: VestingSchedule[] = [];
  const installments: VestingScheduleInstallment[] = [];

  for (const snapshot of params.snapshots) {
    const shouldSkip =
      snapshot.status === "blocked" ||
      snapshot.walletValidationStatus !== "valid" ||
      snapshot.vestingShui <= 0 ||
      !snapshot.walletNormalized;

    if (shouldSkip) continue;

    const vestingPlan = buildVestingInstallments(snapshot.vestingShui, REWARDS_VESTING_MONTHS);

    const scheduleId = makeScheduleId(params.sourcePeriod, snapshot.walletNormalized);
    const createdAt = nowTs();

    const firstUnlockPeriod = addMonthsToRewardPeriod(params.sourcePeriod, 1);
    const lastUnlockPeriod = addMonthsToRewardPeriod(params.sourcePeriod, REWARDS_VESTING_MONTHS);

    const schedule: VestingSchedule = {
      id: scheduleId,
      wallet: snapshot.wallet,
      walletNormalized: snapshot.walletNormalized,

      sourceSnapshotId: snapshot.id,
      sourcePeriod: params.sourcePeriod,

      totalVestingShui: vestingPlan.totalVestingShui,
      monthsCount: vestingPlan.months,

      baseMonthlyShui: vestingPlan.baseMonthlyShui,
      finalMonthAdjustment: vestingPlan.finalMonthAdjustment,

      releasedShui: 0,
      remainingShui: vestingPlan.totalVestingShui,

      nextUnlockDate: toUnlockDate(firstUnlockPeriod),
      lastUnlockDate: toUnlockDate(lastUnlockPeriod),

      status: "active",

      createdAt,
      updatedAt: createdAt,
    };

    schedules.push(schedule);

    vestingPlan.installments.forEach((amount, index) => {
      const installmentIndex = index + 1;
      const unlockPeriod = addMonthsToRewardPeriod(params.sourcePeriod, installmentIndex);

      const installment: VestingScheduleInstallment = {
        id: makeInstallmentId(params.sourcePeriod, snapshot.walletNormalized, installmentIndex),
        scheduleId: schedule.id,

        wallet: snapshot.wallet,
        walletNormalized: snapshot.walletNormalized,

        sourceSnapshotId: snapshot.id,
        sourcePeriod: params.sourcePeriod,

        installmentIndex,
        unlockPeriod,
        unlockDate: toUnlockDate(unlockPeriod),

        plannedAmount: amount,

        status: "pending",

        ledgerEntryId: null,

        createdAt,
        updatedAt: createdAt,
      };

      installments.push(installment);
    });
  }

  return {
    sourcePeriod: params.sourcePeriod,
    schedules,
    installments,
  };
}

export {};
