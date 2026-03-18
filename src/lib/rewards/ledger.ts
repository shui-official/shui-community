import type {
  DistributionLedgerEntry,
  RewardMonthlySnapshot,
  RewardPeriod,
  VestingScheduleInstallment,
} from "./types";

export type LedgerBuildResult = {
  payablePeriod: RewardPeriod;
  immediateEntries: DistributionLedgerEntry[];
  vestingEntries: DistributionLedgerEntry[];
  entries: DistributionLedgerEntry[];
};

function nowTs(): number {
  return Date.now();
}

function makeImmediateLedgerId(payablePeriod: RewardPeriod, snapshotId: string): string {
  return `ledger:immediate:${payablePeriod}:${snapshotId}`;
}

function makeVestingLedgerId(payablePeriod: RewardPeriod, installmentId: string): string {
  return `ledger:vesting:${payablePeriod}:${installmentId}`;
}

export function buildLedgerEntries(params: {
  payablePeriod: RewardPeriod;
  snapshots: RewardMonthlySnapshot[];
  installments: VestingScheduleInstallment[];
}): LedgerBuildResult {
  const createdAt = nowTs();

  const immediateEntries: DistributionLedgerEntry[] = params.snapshots
    .filter((snapshot) => snapshot.immediateShui > 0)
    .map((snapshot) => {
      const isBlocked =
        snapshot.status === "blocked" || snapshot.walletValidationStatus !== "valid";

      return {
        id: makeImmediateLedgerId(params.payablePeriod, snapshot.id),

        wallet: snapshot.wallet,
        walletNormalized: snapshot.walletNormalized,

        entryType: "immediate",

        sourcePeriod: snapshot.period,
        payablePeriod: params.payablePeriod,

        sourceSnapshotId: snapshot.id,
        sourceScheduleId: null,
        sourceInstallmentId: null,

        amountPlanned: snapshot.immediateShui,
        amountSent: 0,

        csvIncluded: !isBlocked,
        csvExportedAt: null,
        csvBatchId: null,

        sentAt: null,
        txRef: null,

        status: isBlocked ? "blocked" : "pending",
        blockReason: isBlocked ? (snapshot.walletValidationReason || "snapshot_blocked") : null,

        createdAt,
        updatedAt: createdAt,
      };
    });

  const vestingEntries: DistributionLedgerEntry[] = params.installments
    .filter((installment) => installment.unlockPeriod === params.payablePeriod)
    .map((installment) => {
      const isBlocked = installment.status === "blocked";

      return {
        id: makeVestingLedgerId(params.payablePeriod, installment.id),

        wallet: installment.wallet,
        walletNormalized: installment.walletNormalized,

        entryType: "vesting",

        sourcePeriod: installment.sourcePeriod,
        payablePeriod: params.payablePeriod,

        sourceSnapshotId: installment.sourceSnapshotId,
        sourceScheduleId: installment.scheduleId,
        sourceInstallmentId: installment.id,

        amountPlanned: installment.plannedAmount,
        amountSent: 0,

        csvIncluded: !isBlocked,
        csvExportedAt: null,
        csvBatchId: null,

        sentAt: null,
        txRef: null,

        status: isBlocked ? "blocked" : "pending",
        blockReason: isBlocked ? "installment_blocked" : null,

        createdAt,
        updatedAt: createdAt,
      };
    });

  return {
    payablePeriod: params.payablePeriod,
    immediateEntries,
    vestingEntries,
    entries: [...immediateEntries, ...vestingEntries],
  };
}

export {};
