import type { NextApiRequest, NextApiResponse } from "next";
import { assertMethod } from "../../../lib/security/validate";
import { getSession } from "../../../lib/security/session";
import { buildMonthlySnapshotsFromQuestStore } from "../../../lib/rewards/snapshot";
import type { RewardPeriod } from "../../../lib/rewards/types";

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

    const period = (req.query.period as string | undefined)?.trim() as RewardPeriod | undefined;
    const conversionRatio = toPositiveNumber(req.query.conversionRatio, 1);

    const result = buildMonthlySnapshotsFromQuestStore({
      period,
      conversionRatio,
    });

    const totalPoints = result.snapshots.reduce((sum, item) => sum + item.totalPoints, 0);
    const totalShui = result.snapshots.reduce((sum, item) => sum + item.totalShui, 0);
    const totalImmediateShui = result.snapshots.reduce((sum, item) => sum + item.immediateShui, 0);
    const totalVestingShui = result.snapshots.reduce((sum, item) => sum + item.vestingShui, 0);

    const validWallets = result.snapshots.filter((item) => item.walletValidationStatus === "valid").length;
    const blockedWallets = result.snapshots.filter((item) => item.status === "blocked").length;

    return res.status(200).json({
      ok: true,
      preview: true,
      period: result.period,
      snapshotDate: result.snapshotDate,
      conversionRatio: result.conversionRatio,
      counts: {
        snapshots: result.snapshots.length,
        validWallets,
        blockedWallets,
      },
      totals: {
        totalPoints,
        totalShui,
        totalImmediateShui,
        totalVestingShui,
      },
      walletValidations: result.walletValidations,
      snapshots: result.snapshots,
    });
  } catch (e: any) {
    const status = e?.statusCode || 500;
    return res.status(status).json({
      ok: false,
      error: e?.message || "server_error",
    });
  }
}
