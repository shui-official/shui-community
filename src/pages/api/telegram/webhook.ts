import type { NextApiRequest, NextApiResponse } from "next";
import { verifyTelegramStartToken, setTelegramLink } from "../../../lib/social/telegram";

/**
 * Webhook Telegram.
 * On ne met PAS requireSameOrigin ici (c’est Telegram).
 * Optionnel: TELEGRAM_WEBHOOK_SECRET (header X-Telegram-Bot-Api-Secret-Token).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return res.status(405).json({ ok: false });

    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (expectedSecret) {
      const got = String(req.headers["x-telegram-bot-api-secret-token"] || "");
      if (got !== expectedSecret) return res.status(401).json({ ok: false });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
    const secret = process.env.TELEGRAM_LINK_SECRET || process.env.SESSION_SECRET || "";
    if (!botToken) return res.status(500).json({ ok: false, error: "telegram_bot_token_missing" });
    if (!secret) return res.status(500).json({ ok: false, error: "telegram_link_secret_missing" });

    const update: any = req.body || {};
    const message = update?.message || update?.edited_message;
    const text: string = String(message?.text || "");

    // On écoute seulement /start <token>
    if (!text.startsWith("/start")) return res.status(200).json({ ok: true });

    const parts = text.split(" ");
    const token = parts[1] ? String(parts[1]).trim() : "";
    if (!token) return res.status(200).json({ ok: true });

    const fromId = Number(message?.from?.id || 0);
    if (!Number.isFinite(fromId) || fromId <= 0) return res.status(200).json({ ok: true });

    const wallet = verifyTelegramStartToken(token, secret);
    if (!wallet) return res.status(200).json({ ok: true });

    setTelegramLink(wallet, fromId);

    return res.status(200).json({ ok: true });
  } catch {
    return res.status(200).json({ ok: true }); // Telegram préfère 200
  }
}
