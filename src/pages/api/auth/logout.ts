import type { NextApiRequest, NextApiResponse } from "next";
import { requireCsrf } from "../../../lib/security/csrf";

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  const env = process.env.AUTH_ALLOWED_ORIGINS || "";
  const list = env
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const defaults = ["http://localhost:3000", "http://localhost:3005"];
  const allowed = (list.length ? list : defaults).map((s) => s.toLowerCase());
  return allowed.includes(origin.toLowerCase());
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method Not Allowed" });
    return;
  }

  const origin = req.headers.origin;
  if (!isAllowedOrigin(origin)) {
    res.status(403).json({ ok: false, error: "Bad Origin" });
    return;
  }

  // ✅ Bank-grade CSRF required
  if (!requireCsrf(req, res)) return;

  const secure = process.env.NODE_ENV === "production";
  const parts = [
    "shui_session=",
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    secure ? "Secure" : "",
    "Max-Age=0",
  ].filter(Boolean);

  res.setHeader("Set-Cookie", parts.join("; "));
  res.status(200).json({ ok: true });
}
