import type { NextApiRequest, NextApiResponse } from "next";
import { assertMethod } from "../../../lib/security/validate";
import { getSession } from "../../../lib/security/session";
import { QUESTS } from "../../../lib/quests/catalog";
import { getClaimsSnapshot } from "../../../lib/quests/store";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    assertMethod(req.method, ["GET"]);

    const session = getSession(req);
    if (!session) return res.status(401).json({ ok: false, error: "unauthorized" });

    const snapshot = getClaimsSnapshot(session.wallet);

    const quests = QUESTS.map((q) => ({
      ...q,
      claimed: snapshot.claimedIds.includes(q.id),
    }));

    return res.status(200).json({
      ok: true,
      wallet: session.wallet,
      points: snapshot.points,
      quests,
      updatedAt: snapshot.updatedAt,
    });
  } catch (e: any) {
    const status = e?.statusCode || 500;
    return res.status(status).json({ ok: false, error: e?.message || "server_error" });
  }
}
