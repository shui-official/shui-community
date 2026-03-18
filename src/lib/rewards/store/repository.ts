import type {
  AnnualRewardBudget,
  CommunityWalletAccounting,
  DistributionLedgerEntry,
  RewardMonthlyBatch,
  RewardMonthlySnapshot,
  RewardPeriod,
  VestingSchedule,
  VestingScheduleInstallment,
  WalletValidationRecord,
} from "../types";
import { readAllRewardsData, readRewardsFile, writeRewardsFile } from "./fileDb";

function byUpdatedAtDesc<T extends { updatedAt: number }>(a: T, b: T): number {
  return b.updatedAt - a.updatedAt;
}

export const rewardsRepository = {
  getAllData() {
    return readAllRewardsData();
  },

  getMonthlyBatches(): RewardMonthlyBatch[] {
    return [...readRewardsFile("monthlyBatches")].sort(byUpdatedAtDesc);
  },

  saveMonthlyBatches(items: RewardMonthlyBatch[]): void {
    writeRewardsFile("monthlyBatches", items);
  },

  getBatchByTargetPeriod(period: RewardPeriod): RewardMonthlyBatch | null {
    return this.getMonthlyBatches().find((item) => item.targetPeriod === period) ?? null;
  },

  getSnapshots(): RewardMonthlySnapshot[] {
    return [...readRewardsFile("snapshots")].sort(byUpdatedAtDesc);
  },

  saveSnapshots(items: RewardMonthlySnapshot[]): void {
    writeRewardsFile("snapshots", items);
  },

  getSnapshotsByPeriod(period: RewardPeriod): RewardMonthlySnapshot[] {
    return this.getSnapshots().filter((item) => item.period === period);
  },

  getVestingSchedules(): VestingSchedule[] {
    return [...readRewardsFile("vestingSchedules")].sort(byUpdatedAtDesc);
  },

  saveVestingSchedules(items: VestingSchedule[]): void {
    writeRewardsFile("vestingSchedules", items);
  },

  getVestingSchedulesBySourcePeriod(period: RewardPeriod): VestingSchedule[] {
    return this.getVestingSchedules().filter((item) => item.sourcePeriod === period);
  },

  getVestingInstallments(): VestingScheduleInstallment[] {
    return [...readRewardsFile("vestingInstallments")].sort(byUpdatedAtDesc);
  },

  saveVestingInstallments(items: VestingScheduleInstallment[]): void {
    writeRewardsFile("vestingInstallments", items);
  },

  getVestingInstallmentsByUnlockPeriod(period: RewardPeriod): VestingScheduleInstallment[] {
    return this.getVestingInstallments().filter((item) => item.unlockPeriod === period);
  },

  getDistributionLedger(): DistributionLedgerEntry[] {
    return [...readRewardsFile("distributionLedger")].sort(byUpdatedAtDesc);
  },

  saveDistributionLedger(items: DistributionLedgerEntry[]): void {
    writeRewardsFile("distributionLedger", items);
  },

  getDistributionLedgerByPayablePeriod(period: RewardPeriod): DistributionLedgerEntry[] {
    return this.getDistributionLedger().filter((item) => item.payablePeriod === period);
  },

  getWalletValidations(): WalletValidationRecord[] {
    return [...readRewardsFile("walletValidations")].sort((a, b) => b.checkedAt - a.checkedAt);
  },

  saveWalletValidations(items: WalletValidationRecord[]): void {
    writeRewardsFile("walletValidations", items);
  },

  getWalletValidationByNormalizedWallet(walletNormalized: string): WalletValidationRecord | null {
    return this.getWalletValidations().find((item) => item.walletNormalized === walletNormalized) ?? null;
  },

  getAnnualBudget(): AnnualRewardBudget | null {
    return readRewardsFile("budget");
  },

  saveAnnualBudget(item: AnnualRewardBudget | null): void {
    writeRewardsFile("budget", item);
  },

  getCommunityWallet(): CommunityWalletAccounting | null {
    return readRewardsFile("communityWallet");
  },

  saveCommunityWallet(item: CommunityWalletAccounting | null): void {
    writeRewardsFile("communityWallet", item);
  },
};

export {};
