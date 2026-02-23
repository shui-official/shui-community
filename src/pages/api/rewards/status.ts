import type { NextApiRequest, NextApiResponse } from "next";
import { assertMethod } from "../../../lib/security/validate";
import { getSession } from "../../../lib/security/session";
import { REWARDS, getEpochWindow } from "../../../lib/rewards/config";
import { getAllWalletPoints, getClaimsSnapshot } from "../../../lib/quests/store";
import { getRewardSnapshot, hasClaimedEpoch } from "../../../lib/rewards/store";

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
    if (!session) return res.status(401).json({ ok: false, error: "unauthorized" });

    const { epochId, start, end } = getEpochWindow();
    const me = getClaimsSnapshot(session.wallet);

    const all = getAllWalletPoints();
    const eligibleTotal = all
      .filter((x) => (x.points?.total ?? 0) >= REWARDS.minPoints)
      .reduce((sum, x) => sum + (x.points?.total ?? 0), 0);

    const myPoints = me.points?.total ?? 0;
    const eligible = myPoints >= REWARDS.minPoints && eligibleTotal > 0;
    const estimate = eligible ? (myPoints / eligibleTotal) * REWARDS.poolShui : 0;

    const rewardSnap = getRewardSnapshot(session.wallet);

    const admins = getAdminWallets();
    const isAdmin = admins.has(session.wallet);

    return res.status(200).json({
      ok: true,
      epochId,
      epochStart: start,
      epochEnd: end,
      poolShui: REWARDS.poolShui,
      minPoints: REWARDS.minPoints,
      myPoints,
      eligibleTotalPoints: eligibleTotal,
      eligible,
      estimatedShui: Math.floor(estimate),
      alreadyClaimed: hasClaimedEpoch(session.wallet, epochId),
      totalClaimedShui: rewardSnap.totalClaimedShui,
      isAdmin,
    });
  } catch (e: any) {
    const status = e?.statusCode || 500;
    return res.status(status).json({ ok: false, error: e?.message || "server_error" });
  }
}
