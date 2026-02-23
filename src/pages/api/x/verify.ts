import type { NextApiRequest, NextApiResponse } from "next";
import { assertMethod, requireSameOrigin } from "../../../lib/security/validate";
import { rateLimitOrThrow } from "../../../lib/security/rateLimit";
import { getSession } from "../../../lib/security/session";
import { getXLink, fetchXUserIdByUsername, checkFollowing } from "../../../lib/social/x";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    assertMethod(req.method, ["POST"]);
    requireSameOrigin(req);
    rateLimitOrThrow({ req, res, key: "x:verify", limit: 20, windowMs: 60_000 });

    const session = getSession(req);
    if (!session) return res.status(401).json({ ok: false, error: "unauthorized" });

    const target = process.env.X_TARGET_USERNAME || "Shui_Labs";
    const link = getXLink(session.wallet);
    if (!link) return res.status(400).json({ ok: false, error: "x_not_linked" });

    const targetId = await fetchXUserIdByUsername(link.accessToken, target);
    if (!targetId.ok) return res.status(500).json({ ok: false, error: targetId.error });

    const v = await checkFollowing(link.accessToken, link.userId, targetId.id);
    if (!v.ok) return res.status(403).json({ ok: false, error: v.error });

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    const status = e?.statusCode || 500;
    return res.status(status).json({ ok: false, error: e?.message || "server_error" });
  }
}
