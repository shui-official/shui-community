import type { NextApiRequest, NextApiResponse } from "next";
import { assertMethod, isString, requireSameOrigin, safeJson } from "../../../lib/security/validate";
import { rateLimitOrThrow } from "../../../lib/security/rateLimit";
import { getSession } from "../../../lib/security/session";
import { getQuestById } from "../../../lib/quests/catalog";
import { claimQuest, getClaimsSnapshot } from "../../../lib/quests/store";

type Body = {
  action: "quest-claim";
  questId: string;
};

const ALLOWED_ACTIONS = new Set(["quest-claim"]);

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    assertMethod(req.method, ["POST"]);
    requireSameOrigin(req);

    // anti-spam sur le claim
    rateLimitOrThrow({ req, res, key: "quest:claim", limit: 10, windowMs: 60_000 });

    const session = getSession(req);
    if (!session) return res.status(401).json({ ok: false, error: "unauthorized" });

    const body = safeJson<Body>(req.body);
    const action = body.action;
    const questId = body.questId;

    // allowlist d’action
    if (!isString(action) || !ALLOWED_ACTIONS.has(action)) {
      return res.status(400).json({ ok: false, error: "action_not_allowed" });
    }

    if (!isString(questId)) return res.status(400).json({ ok: false, error: "quest_id_required" });

    const quest = getQuestById(questId);
    if (!quest) return res.status(404).json({ ok: false, error: "quest_not_found" });

    const result = claimQuest(session.wallet, quest);
    const snapshot = getClaimsSnapshot(session.wallet);

    return res.status(200).json({
      ok: true,
      alreadyClaimed: result.alreadyClaimed,
      points: snapshot.points,
      claimedIds: snapshot.claimedIds,
    });
  } catch (e: any) {
    const status = e?.statusCode || 500;
    return res.status(status).json({ ok: false, error: e?.message || "server_error" });
  }
}
