import type { NextApiRequest, NextApiResponse } from "next";
import { assertMethod } from "../../../../lib/security/validate";
import { getSession } from "../../../../lib/security/session";
import { rewardsRepository } from "../../../../lib/rewards/store/repository";
import { getCurrentRewardPeriod } from "../../../../lib/rewards/period";
import { buildImmediateCsvRows, toCsvString } from "../../../../lib/rewards/csv";
import type { RewardPeriod } from "../../../../lib/rewards/types";

function getAdminWallets(): Set<string> {
  const raw = process.env.REWARDS_ADMIN_WALLETS || "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
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

    const ledger = rewardsRepository.getDistributionLedgerByPayablePeriod(period);
    const rows = buildImmediateCsvRows(ledger, period);
    const csv = toCsvString(rows);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="shui-immediate-${period}.csv"`);
    return res.status(200).send(csv);
  } catch (e: any) {
    const status = e?.statusCode || 500;
    return res.status(status).json({
      ok: false,
      error: e?.message || "server_error",
    });
  }
}
