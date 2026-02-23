import type { NextApiRequest, NextApiResponse } from "next";
import { assertMethod } from "../../../lib/security/validate";
import { getSession } from "../../../lib/security/session";
import { getAllWalletPoints, getClaimsSnapshot, getCurrentMonthKey } from "../../../lib/quests/store";
import { computeMonthlyPoolDistribution, getRewardConfigFromEnv, computeEligiblePoints } from "../../../lib/rewards/pool";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    assertMethod(req.method, ["GET"]);

    const session = getSession(req);
    if (!session) return res.status(401).json({ ok: false, error: "unauthorized" });

    const cfg = getRewardConfigFromEnv();
    const mk = getCurrentMonthKey();

    const all = getAllWalletPoints(mk); // [{wallet, points:{activity,onchain,total}}]
    const dist = computeMonthlyPoolDistribution(all, cfg);

    const mine = dist.find((d) => d.wallet === session.wallet);
    const mineSnap = getClaimsSnapshot(session.wallet, mk);

    const totalEligible = dist.reduce((a, d) => a + d.eligiblePoints, 0);

    return res.status(200).json({
      ok: true,
      month: mk,
      config: cfg,
      pool: {
        poolMonthlyShui: cfg.poolMonthlyShui,
        pointToShui: cfg.pointToShui,
        totalEligiblePoints: totalEligible,
        walletsCount: dist.length,
      },
      me: mine
        ? mine
        : {
            wallet: session.wallet,
            activityPoints: mineSnap.points.activity,
            onchainPoints: mineSnap.points.onchain,
            totalPoints: mineSnap.points.total,
            eligiblePoints: computeEligiblePoints(mineSnap.points, cfg),
            estimatedShuiIfLinear: Math.floor(computeEligiblePoints(mineSnap.points, cfg) * cfg.pointToShui),
            poolShare: 0,
            estimatedShuiFromPool: 0,
          },
    });
  } catch (e: any) {
    const status = e?.statusCode || 500;
    return res.status(status).json({ ok: false, error: e?.message || "server_error" });
  }
}
