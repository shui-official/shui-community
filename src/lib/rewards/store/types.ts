import type {
  AnnualRewardBudget,
  CommunityWalletAccounting,
  DistributionLedgerEntry,
  RewardMonthlyBatch,
  RewardMonthlySnapshot,
  VestingSchedule,
  VestingScheduleInstallment,
  WalletValidationRecord,
} from "../types";

export type RewardsDataCollections = {
  monthlyBatches: RewardMonthlyBatch[];
  snapshots: RewardMonthlySnapshot[];
  vestingSchedules: VestingSchedule[];
  vestingInstallments: VestingScheduleInstallment[];
  distributionLedger: DistributionLedgerEntry[];
  walletValidations: WalletValidationRecord[];
  budget: AnnualRewardBudget | null;
  communityWallet: CommunityWalletAccounting | null;
};

export type RewardsCollectionKey = keyof RewardsDataCollections;

export {};
