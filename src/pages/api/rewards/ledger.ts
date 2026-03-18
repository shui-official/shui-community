import type { NextApiRequest, NextApiResponse } from "next";
import { assertMethod } from "../../../lib/security/validate";
import { getSession } from "../../../lib/security/session";
import { rewardsRepository } from "../../../lib/rewards/store/repository";
import { getCurrentRewardPeriod } from "../../../lib/rewards/period";
import type {
  DistributionEntryType,
  DistributionLedgerEntry,
  DistributionLedgerStatus,
  RewardPeriod,
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

function isLedgerType(value: string | undefined): value is DistributionEntryType {
  return value === "immediate" || value === "vesting";
}

function isLedgerStatus(value: string | undefined): value is DistributionLedgerStatus {
  return value === "pending" ||
    value === "exported" ||
    value === "sent" ||
    value === "blocked" ||
    value === "completed";
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
    const type = (req.query.type as string | undefined)?.trim();
    const status = (req.query.status as string | undefined)?.trim();

    let entries = rewardsRepository.getDistributionLedgerByPayablePeriod(period);

    if (isLedgerType(type)) {
      entries = entries.filter((item) => item.entryType === type);
    }

    if (isLedgerStatus(status)) {
      entries = entries.filter((item) => item.status === status);
    }

    const immediateEntries = entries.filter((item) => item.entryType === "immediate");
    const vestingEntries = entries.filter((item) => item.entryType === "vesting");
    const blockedEntries = entries.filter((item) => item.status === "blocked");
    const pendingEntries = entries.filter((item) => item.status === "pending");

    return res.status(200).json({
      ok: true,
      period,
      filters: {
        type: isLedgerType(type) ? type : null,
        status: isLedgerStatus(status) ? status : null,
      },
      counts: {
        total: entries.length,
        immediate: immediateEntries.length,
        vesting: vestingEntries.length,
        pending: pendingEntries.length,
        blocked: blockedEntries.length,
      },
      totals: {
        plannedShui: sumBy(entries, (item) => item.amountPlanned),
        sentShui: sumBy(entries, (item) => item.amountSent),
        immediatePlannedShui: sumBy(immediateEntries, (item) => item.amountPlanned),
        vestingPlannedShui: sumBy(vestingEntries, (item) => item.amountPlanned),
      },
      entries,
    });
  } catch (e: any) {
    const status = e?.statusCode || 500;
    return res.status(status).json({
      ok: false,
      error: e?.message || "server_error",
    });
  }
}
