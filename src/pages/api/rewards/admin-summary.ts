import type { NextApiRequest, NextApiResponse } from "next";
import { assertMethod } from "../../../lib/security/validate";
import { getSession } from "../../../lib/security/session";
import { rewardsRepository } from "../../../lib/rewards/store/repository";
import { getCurrentRewardPeriod } from "../../../lib/rewards/period";
import type {
  DistributionLedgerEntry,
  RewardMonthlySnapshot,
  RewardPeriod,
  VestingSchedule,
  VestingScheduleInstallment,
} from "../../../lib/rewards/types";

function getAdminWallets(): Set<string> {
  const raw = process.env.REWARDS_ADMIN_WALLETS || "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

function sumBy<T>(items: T[], selector: (item: T) => number): number {
  return items.reduce((sum, item) => sum + selector(item), 0);
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    assertMethod(req.method, ["GET"]);

    const session = getSession(req);
    if (!session) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }

    const admins = getAdminWallets();
    if (!admins.has(session.wallet)) {
      return res.status(403).json({ ok: false, error: "forbidden" });
    }

    const period = ((req.query.period as string | undefined)?.trim() || getCurrentRewardPeriod()) as RewardPeriod;

    const batch = rewardsRepository.getBatchByTargetPeriod(period);

    const snapshots: RewardMonthlySnapshot[] = rewardsRepository.getSnapshotsByPeriod(period);
    const schedules: VestingSchedule[] = rewardsRepository.getVestingSchedulesBySourcePeriod(period);
    const installments: VestingScheduleInstallment[] = rewardsRepository
      .getVestingInstallments()
      .filter((item) => item.sourcePeriod === period);

    const ledger: DistributionLedgerEntry[] = rewardsRepository.getDistributionLedgerByPayablePeriod(period);

    const validSnapshots = snapshots.filter((item) => item.walletValidationStatus === "valid");
    const blockedSnapshots = snapshots.filter((item) => item.status === "blocked");

    const immediateLedger = ledger.filter((item) => item.entryType === "immediate");
    const vestingLedger = ledger.filter((item) => item.entryType === "vesting");

    const pendingLedger = ledger.filter((item) => item.status === "pending");
    const blockedLedger = ledger.filter((item) => item.status === "blocked");
    const completedLedger = ledger.filter((item) => item.status === "completed");

    return res.status(200).json({
      ok: true,
      period,
      batch,
      state: {
        hasBatch: Boolean(batch),
        hasSnapshots: snapshots.length > 0,
        hasLedger: ledger.length > 0,
        isEmpty:
          !batch &&
          snapshots.length === 0 &&
          schedules.length === 0 &&
          installments.length === 0 &&
          ledger.length === 0,
      },
      counts: {
        snapshots: snapshots.length,
        validSnapshots: validSnapshots.length,
        blockedSnapshots: blockedSnapshots.length,
        vestingSchedules: schedules.length,
        vestingInstallments: installments.length,
        ledgerTotal: ledger.length,
        ledgerImmediate: immediateLedger.length,
        ledgerVesting: vestingLedger.length,
        ledgerPending: pendingLedger.length,
        ledgerBlocked: blockedLedger.length,
        ledgerCompleted: completedLedger.length,
      },
      totals: {
        snapshotTotalShui: sumBy(snapshots, (item) => item.totalShui),
        snapshotImmediateShui: sumBy(snapshots, (item) => item.immediateShui),
        snapshotVestingShui: sumBy(snapshots, (item) => item.vestingShui),

        ledgerPlannedShui: sumBy(ledger, (item) => item.amountPlanned),
        ledgerSentShui: sumBy(ledger, (item) => item.amountSent),

        ledgerImmediatePlannedShui: sumBy(immediateLedger, (item) => item.amountPlanned),
        ledgerVestingPlannedShui: sumBy(vestingLedger, (item) => item.amountPlanned),

        ledgerPendingShui: sumBy(pendingLedger, (item) => item.amountPlanned),
        ledgerBlockedShui: sumBy(blockedLedger, (item) => item.amountPlanned),
        ledgerCompletedShui: sumBy(completedLedger, (item) => item.amountSent),
      },
      preview: {
        firstSnapshots: snapshots.slice(0, 5),
        firstLedgerEntries: ledger.slice(0, 10),
      },
    });
  } catch (e: any) {
    const status = e?.statusCode || 500;
    return res.status(status).json({
      ok: false,
      error: e?.message || "server_error",
    });
  }
}
