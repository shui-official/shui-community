import type { NextApiRequest, NextApiResponse } from "next";
import { assertMethod, requireSameOrigin, safeJson } from "../../../../lib/security/validate";
import { getSession } from "../../../../lib/security/session";
import { buildLedgerEntries } from "../../../../lib/rewards/ledger";
import { buildMonthlySnapshotsFromQuestStore } from "../../../../lib/rewards/snapshot";
import { rewardsRepository } from "../../../../lib/rewards/store/repository";
import { buildVestingFromSnapshots } from "../../../../lib/rewards/vesting";
import type { RewardMonthlyBatch, RewardPeriod } from "../../../../lib/rewards/types";

type RunMonthlyRewardsBody = {
  period?: RewardPeriod;
  conversionRatio?: number;
  snapshotDate?: string;
  force?: boolean;
};

function getAdminWallets(): Set<string> {
  const raw = process.env.REWARDS_ADMIN_WALLETS || "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

function toPositiveNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function makeBatchId(period: RewardPeriod): string {
  return `batch:${period}`;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    assertMethod(req.method, ["POST"]);
    requireSameOrigin(req);

    const session = getSession(req);
    if (!session) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }

    const admins = getAdminWallets();
    if (!admins.has(session.wallet)) {
      return res.status(403).json({ ok: false, error: "forbidden" });
    }

    const body = safeJson<RunMonthlyRewardsBody>(req.body) || {};

    const conversionRatio = toPositiveNumber(body.conversionRatio, 1);
    const force = Boolean(body.force);

    const preview = buildMonthlySnapshotsFromQuestStore({
      period: body.period,
      conversionRatio,
      snapshotDate: body.snapshotDate,
    });

    const existingBatch = rewardsRepository.getBatchByTargetPeriod(preview.period);
    if (existingBatch && !force) {
      return res.status(409).json({
        ok: false,
        error: "batch_already_exists",
        period: preview.period,
        existingBatch,
      });
    }

    const vestingPreview = buildVestingFromSnapshots({
      sourcePeriod: preview.period,
      snapshots: preview.snapshots,
    });

    const ledgerPreview = buildLedgerEntries({
      payablePeriod: preview.period,
      snapshots: preview.snapshots,
      installments: vestingPreview.installments,
    });

    const allBatches = rewardsRepository.getMonthlyBatches();
    const allSnapshots = rewardsRepository.getSnapshots();
    const allWalletValidations = rewardsRepository.getWalletValidations();
    const allSchedules = rewardsRepository.getVestingSchedules();
    const allInstallments = rewardsRepository.getVestingInstallments();
    const allLedger = rewardsRepository.getDistributionLedger();

    const filteredBatches = allBatches.filter((item) => item.targetPeriod !== preview.period);
    const filteredSnapshots = allSnapshots.filter((item) => item.period !== preview.period);
    const filteredWalletValidations = allWalletValidations.filter(
      (item) => !preview.walletValidations.some((nextItem) => nextItem.id === item.id)
    );
    const filteredSchedules = allSchedules.filter((item) => item.sourcePeriod !== preview.period);
    const filteredInstallments = allInstallments.filter((item) => item.sourcePeriod !== preview.period);
    const filteredLedger = allLedger.filter((item) => item.payablePeriod !== preview.period);

    const now = Date.now();

    const batch: RewardMonthlyBatch = {
      id: makeBatchId(preview.period),
      targetPeriod: preview.period,
      executionDate: preview.snapshotDate,
      status: "generated",
      snapshotCount: preview.snapshots.length,
      immediateLedgerCount: ledgerPreview.immediateEntries.length,
      vestingInstallmentCount: vestingPreview.installments.length,
      errorsCount: preview.snapshots.filter((item) => item.status === "blocked").length,
      notes: null,
      createdAt: existingBatch?.createdAt ?? now,
      updatedAt: now,
    };

    rewardsRepository.saveMonthlyBatches([batch, ...filteredBatches]);
    rewardsRepository.saveSnapshots([...preview.snapshots, ...filteredSnapshots]);
    rewardsRepository.saveWalletValidations([...preview.walletValidations, ...filteredWalletValidations]);
    rewardsRepository.saveVestingSchedules([...vestingPreview.schedules, ...filteredSchedules]);
    rewardsRepository.saveVestingInstallments([...vestingPreview.installments, ...filteredInstallments]);
    rewardsRepository.saveDistributionLedger([...ledgerPreview.entries, ...filteredLedger]);

    const totalPoints = preview.snapshots.reduce((sum, item) => sum + item.totalPoints, 0);
    const totalShui = preview.snapshots.reduce((sum, item) => sum + item.totalShui, 0);
    const totalImmediateShui = preview.snapshots.reduce((sum, item) => sum + item.immediateShui, 0);
    const totalVestingShui = preview.snapshots.reduce((sum, item) => sum + item.vestingShui, 0);

    return res.status(200).json({
      ok: true,
      saved: true,
      period: preview.period,
      snapshotDate: preview.snapshotDate,
      conversionRatio: preview.conversionRatio,
      batch,
      counts: {
        snapshots: preview.snapshots.length,
        walletValidations: preview.walletValidations.length,
        blockedWallets: preview.snapshots.filter((item) => item.status === "blocked").length,
        vestingSchedules: vestingPreview.schedules.length,
        vestingInstallments: vestingPreview.installments.length,
        immediateLedgerEntries: ledgerPreview.immediateEntries.length,
        vestingLedgerEntries: ledgerPreview.vestingEntries.length,
        totalLedgerEntries: ledgerPreview.entries.length,
      },
      totals: {
        totalPoints,
        totalShui,
        totalImmediateShui,
        totalVestingShui,
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
