import type { NextApiRequest, NextApiResponse } from "next";
import { assertMethod, isString, requireSameOrigin, safeJson } from "../../../lib/security/validate";
import { rateLimitOrThrow } from "../../../lib/security/rateLimit";
import { getSession } from "../../../lib/security/session";
import { REWARDS, getEpochWindow } from "../../../lib/rewards/config";
import { getAllWalletPoints, getClaimsSnapshot } from "../../../lib/quests/store";
import { claimEpoch } from "../../../lib/rewards/store";

type Body = {
  action: "rewards-claim";
};

const ALLOWED_ACTIONS = new Set(["rewards-claim"]);

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    assertMethod(req.method, ["POST"]);
    requireSameOrigin(req);

    // anti-spam claim rewards
    rateLimitOrThrow({ req, res, key: "rewards:claim", limit: 5, windowMs: 60_000 });

    const session = getSession(req);
    if (!session) return res.status(401).json({ ok: false, error: "unauthorized" });

    const body = safeJson<Body>(req.body);
    if (!isString(body.action) || !ALLOWED_ACTIONS.has(body.action)) {
      return res.status(400).json({ ok: false, error: "action_not_allowed" });
    }

    const { epochId } = getEpochWindow();
    const me = getClaimsSnapshot(session.wallet);

    const all = getAllWalletPoints();
    const eligibleTotal = all
      .filter((x) => x.points >= REWARDS.minPoints)
      .reduce((sum, x) => sum + x.points, 0);

    const eligible = me.points >= REWARDS.minPoints && eligibleTotal > 0;
    if (!eligible) return res.status(400).json({ ok: false, error: "not_eligible" });

    const amount = Math.floor((me.points / eligibleTotal) * REWARDS.poolShui);
    const result = claimEpoch(session.wallet, epochId, amount);

    return res.status(200).json({
      ok: true,
      epochId,
      amountShui: amount,
      alreadyClaimed: result.alreadyClaimed,
      totalClaimedShui: result.totalClaimedShui,
    });
  } catch (e: any) {
    const status = e?.statusCode || 500;
    return res.status(status).json({ ok: false, error: e?.message || "server_error" });
  }
}
