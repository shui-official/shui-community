export type RewardPeriod = `${number}-${string}`;

export type WalletValidationStatus = "valid" | "invalid" | "missing";

export type RewardSnapshotStatus = "draft" | "finalized" | "blocked";

export type VestingScheduleStatus = "active" | "completed" | "blocked" | "cancelled";

export type VestingInstallmentStatus =
  | "pending"
  | "ready"
  | "exported"
  | "sent"
  | "blocked"
  | "completed";

export type DistributionLedgerStatus =
  | "pending"
  | "exported"
  | "sent"
  | "blocked"
  | "completed";

export type DistributionEntryType = "immediate" | "vesting";

export type RewardTotals = {
  totalShui: number;
  immediateShui: number;
  vestingShui: number;
};

export type WalletValidationRecord = {
  id: string;
  walletRaw: string;
  walletNormalized: string;
  status: WalletValidationStatus;
  isValid: boolean;
  reason: string | null;
  canBeIncludedInCsv: boolean;
  checkedAt: number;
};

export type RewardMonthlySnapshot = {
  id: string;
  period: RewardPeriod;
  snapshotDate: string;
  wallet: string;
  walletNormalized: string;

  walletValidationStatus: WalletValidationStatus;
  walletValidationReason: string | null;

  activityPoints: number;
  onchainPoints: number;
  reviewPoints: number;
  totalPoints: number;

  conversionRatio: number;

  totalShui: number;
  immediateShui: number;
  vestingShui: number;

  roundingRemainder: number;

  status: RewardSnapshotStatus;

  createdAt: number;
  updatedAt: number;
};

export type VestingSchedule = {
  id: string;
  wallet: string;
  walletNormalized: string;

  sourceSnapshotId: string;
  sourcePeriod: RewardPeriod;

  totalVestingShui: number;
  monthsCount: number;

  baseMonthlyShui: number;
  finalMonthAdjustment: number;

  releasedShui: number;
  remainingShui: number;

  nextUnlockDate: string | null;
  lastUnlockDate: string | null;

  status: VestingScheduleStatus;

  createdAt: number;
  updatedAt: number;
};

export type VestingScheduleInstallment = {
  id: string;
  scheduleId: string;

  wallet: string;
  walletNormalized: string;

  sourceSnapshotId: string;
  sourcePeriod: RewardPeriod;

  installmentIndex: number;
  unlockPeriod: RewardPeriod;
  unlockDate: string;

  plannedAmount: number;

  status: VestingInstallmentStatus;

  ledgerEntryId: string | null;

  createdAt: number;
  updatedAt: number;
};

export type DistributionLedgerEntry = {
  id: string;

  wallet: string;
  walletNormalized: string;

  entryType: DistributionEntryType;

  sourcePeriod: RewardPeriod;
  payablePeriod: RewardPeriod;

  sourceSnapshotId: string | null;
  sourceScheduleId: string | null;
  sourceInstallmentId: string | null;

  amountPlanned: number;
  amountSent: number;

  csvIncluded: boolean;
  csvExportedAt: number | null;
  csvBatchId: string | null;

  sentAt: number | null;
  txRef: string | null;

  status: DistributionLedgerStatus;
  blockReason: string | null;

  createdAt: number;
  updatedAt: number;
};

export type RewardMonthlyBatch = {
  id: string;
  targetPeriod: RewardPeriod;
  executionDate: string;

  status: "draft" | "generated" | "finalized" | "cancelled";

  snapshotCount: number;
  immediateLedgerCount: number;
  vestingInstallmentCount: number;
  errorsCount: number;

  notes: string | null;

  createdAt: number;
  updatedAt: number;
};

export type AnnualRewardBudget = {
  id: string;
  year: number;

  annualCapShui: number;
  sentShui: number;
  engagedShui: number;
  remainingShui: number;
  consumedPercent: number;

  updatedAt: number;
};

export type CommunityWalletAccounting = {
  id: string;

  allocationTotalShui: number;
  sentShui: number;
  engagedVestingShui: number;
  availableShui: number;

  updatedAt: number;
};

export type CsvExportRow = {
  wallet: string;
  amount: number;
  label: string;
};

export type MarkSentPayload = {
  entryIds: string[];
  sentAt: number;
  csvBatchId?: string | null;
  txRef?: string | null;
};

export {};
