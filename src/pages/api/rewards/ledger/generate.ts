import type { NextApiRequest, NextApiResponse } from "next";
import { assertMethod, requireSameOrigin, safeJson } from "../../../../lib/security/validate";
import { getSession } from "../../../../lib/security/session";
import { rewardsRepository } from "../../../../lib/rewards/store/repository";
import { buildLedgerEntries } from "../../../../lib/rewards/ledger";
import { getCurrentRewardPeriod } from "../../../../lib/rewards/period";
import type { DistributionLedgerEntry, RewardPeriod, VestingScheduleInstallment } from "../../../../lib/rewards/types";

type GenerateLedgerBody = {
  payablePeriod?: RewardPeriod;
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

function isValidRewardPeriod(value: string | undefined): value is RewardPeriod {
  return Boolean(value && /^\d{4}-\d{2}$/.test(value));
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

    const body = safeJson<GenerateLedgerBody>(req.body) || {};
    const payablePeriodRaw = String(body.payablePeriod || getCurrentRewardPeriod()).trim();
    const force = Boolean(body.force);

    if (!isValidRewardPeriod(payablePeriodRaw)) {
      return res.status(400).json({ ok: false, error: "invalid_payable_period" });
    }

    const payablePeriod = payablePeriodRaw as RewardPeriod;

    const allLedger = rewardsRepository.getDistributionLedger();
    const existingForPeriod = allLedger.filter((item) => item.payablePeriod === payablePeriod);
    const existingVestingForPeriod = existingForPeriod.filter((item) => item.entryType === "vesting");

    if (existingVestingForPeriod.length > 0 && !force) {
      return res.status(409).json({
        ok: false,
        error: "vesting_ledger_already_exists_for_period",
        payablePeriod,
        existingCount: existingVestingForPeriod.length,
      });
    }

    const allInstallments = rewardsRepository.getVestingInstallments();
    const installmentsForPeriod: VestingScheduleInstallment[] = allInstallments.filter(
      (item) => item.unlockPeriod === payablePeriod
    );

    const ledgerPreview = buildLedgerEntries({
      payablePeriod,
      snapshots: [],
      installments: installmentsForPeriod,
    });

    const nextLedger: DistributionLedgerEntry[] = [
      ...allLedger.filter(
        (item) => !(item.payablePeriod === payablePeriod && item.entryType === "vesting")
      ),
      ...ledgerPreview.vestingEntries,
    ];

    rewardsRepository.saveDistributionLedger(nextLedger);

    return res.status(200).json({
      ok: true,
      saved: true,
      payablePeriod,
      counts: {
        installmentsMatched: installmentsForPeriod.length,
        vestingLedgerEntriesCreated: ledgerPreview.vestingEntries.length,
      },
      totals: {
        vestingPlannedShui: ledgerPreview.vestingEntries.reduce(
          (sum, item) => sum + item.amountPlanned,
          0
        ),
      },
      entries: ledgerPreview.vestingEntries,
    });
  } catch (e: any) {
    const status = e?.statusCode || 500;
    return res.status(status).json({
      ok: false,
      error: e?.message || "server_error",
    });
  }
}
