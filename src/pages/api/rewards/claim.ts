import type { NextApiRequest, NextApiResponse } from "next";
import { assertMethod, requireSameOrigin, safeJson } from "../../../lib/security/validate";
import { rateLimitOrThrow } from "../../../lib/security/rateLimit";
import { getSession } from "../../../lib/security/session";

import { REWARDS } from "../../../lib/rewards/config";
import { getAllWalletPoints } from "../../../lib/quests/store";
import { getClaimsSnapshot } from "../../../lib/quests/store";
import { markClaimed, hasClaimed } from "../../../lib/rewards/store";
import { computeMonthlyAllocations } from "../../../lib/rewards/calc";

type Body = {
  action: "rewards-claim";
};

const ALLOWED = new Set(["rewards-claim"]);

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    assertMethod(req.method, ["POST"]);
    requireSameOrigin(req);

    rateLimitOrThrow({ req, res, key: "rewards:claim", limit: 10, windowMs: 60_000 });

    const session = getSession(req);
    if (!session) return res.status(401).json({ ok: false, error: "unauthorized" });

    const body = safeJson<Body>(req.body);
    if (!body || !ALLOWED.has(body.action)) return res.status(400).json({ ok: false, error: "action_not_allowed" });

    // Already claimed this epoch?
    const { epochId } = computeMonthlyAllocations(Date.now());
    if (hasClaimed(epochId, session.wallet)) {
      return res.status(200).json({ ok: true, alreadyClaimed: true, epochId });
    }

    // Points snapshot (monthly in-memory)
    const me = getClaimsSnapshot(session.wallet);

    // All wallets total eligible points
    const all = getAllWalletPoints();
    const eligibleTotal = all
      .filter((x) => (x.points?.total ?? 0) >= REWARDS.minPoints)
      .reduce((sum, x) => sum + (x.points?.total ?? 0), 0);

    const myTotal = me.points?.total ?? 0;
    const eligible = myTotal >= REWARDS.minPoints && eligibleTotal > 0;

    if (!eligible) {
      return res.status(403).json({
        ok: false,
        error: "not_eligible",
        epochId,
        minPoints: REWARDS.minPoints,
        myPoints: myTotal,
      });
    }

    // Mark claimed (server-side)
    markClaimed(epochId, session.wallet);

    return res.status(200).json({
      ok: true,
      epochId,
      myPoints: myTotal,
    });
  } catch (e: any) {
    const status = e?.statusCode || 500;
    return res.status(status).json({ ok: false, error: e?.message || "server_error" });
  }
}
