import type { NextApiRequest, NextApiResponse } from "next";
import { assertMethod, requireSameOrigin } from "../../../lib/security/validate";
import { rateLimitOrThrow } from "../../../lib/security/rateLimit";
import { getSession } from "../../../lib/security/session";
import { getTelegramLink, isTelegramMember } from "../../../lib/social/telegram";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    assertMethod(req.method, ["POST"]);
    requireSameOrigin(req);

    rateLimitOrThrow({ req, res, key: "telegram:verify", limit: 20, windowMs: 60_000 });

    const session = getSession(req);
    if (!session) return res.status(401).json({ ok: false, error: "unauthorized" });

    const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
    const chatId = process.env.TELEGRAM_CHAT_ID || "";
    if (!botToken) return res.status(500).json({ ok: false, error: "telegram_bot_token_missing" });
    if (!chatId) return res.status(500).json({ ok: false, error: "telegram_chat_id_missing" });

    const userId = getTelegramLink(session.wallet);
    if (!userId) return res.status(400).json({ ok: false, error: "telegram_not_linked" });

    const v = await isTelegramMember({ botToken, chatId, userId });
    if (!v.ok) return res.status(403).json({ ok: false, error: v.error });

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    const status = e?.statusCode || 500;
    return res.status(status).json({ ok: false, error: e?.message || "server_error" });
  }
}
