import type { NextApiRequest, NextApiResponse } from "next";
import { assertMethod, requireSameOrigin } from "../../../lib/security/validate";
import { rateLimitOrThrow } from "../../../lib/security/rateLimit";
import { getSession } from "../../../lib/security/session";
import { createTelegramStartToken } from "../../../lib/social/telegram";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    assertMethod(req.method, ["POST"]);
    requireSameOrigin(req);

    rateLimitOrThrow({ req, res, key: "telegram:link", limit: 10, windowMs: 60_000 });

    const session = getSession(req);
    if (!session) return res.status(401).json({ ok: false, error: "unauthorized" });

    const botUsername = process.env.TELEGRAM_BOT_USERNAME || "";
    const secret = process.env.TELEGRAM_LINK_SECRET || process.env.SESSION_SECRET || "";
    if (!botUsername) return res.status(500).json({ ok: false, error: "telegram_bot_username_missing" });
    if (!secret) return res.status(500).json({ ok: false, error: "telegram_link_secret_missing" });

    const token = createTelegramStartToken(session.wallet, secret, 10 * 60);
    const url = `https://t.me/${botUsername}?start=${encodeURIComponent(token)}`;

    return res.status(200).json({ ok: true, url, expiresInSeconds: 600 });
  } catch (e: any) {
    const status = e?.statusCode || 500;
    return res.status(status).json({ ok: false, error: e?.message || "server_error" });
  }
}
