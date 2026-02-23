import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";

function verifySession(token: string, secret: string): any | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;

  const expected = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;

  try {
    const json = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!json || typeof json.wallet !== "string") return null;
    if (typeof json.exp !== "number" || Date.now() > json.exp) return null;
    return json;
  } catch {
    return null;
  }
}

function getCookie(req: NextApiRequest, name: string): string | null {
  const h = req.headers.cookie;
  if (!h) return null;
  const parts = h.split(";").map((s) => s.trim());
  for (const p of parts) {
    const idx = p.indexOf("=");
    if (idx === -1) continue;
    const k = p.slice(0, idx);
    const v = p.slice(idx + 1);
    if (k === name) return v;
  }
  return null;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");

  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    res.status(500).json({ ok: false, error: "server_misconfigured" });
    return;
  }

  const token = getCookie(req, "shui_session");
  if (!token) {
    res.status(401).json({ ok: false });
    return;
  }

  const session = verifySession(token, secret);
  if (!session) {
    res.status(401).json({ ok: false });
    return;
  }

  res.status(200).json({ ok: true, wallet: session.wallet, exp: session.exp });
}
