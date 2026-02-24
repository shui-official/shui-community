import type { NextApiRequest, NextApiResponse } from "next";
import { ensureCsrf } from "../../../lib/security/csrf";

function getRequestOrigin(req: NextApiRequest): string | undefined {
  const origin = req.headers.origin;
  if (typeof origin === "string" && origin.trim()) return origin.trim();

  const referer = req.headers.referer;
  if (typeof referer === "string" && referer.trim()) {
    try {
      const u = new URL(referer);
      return u.origin;
    } catch {
      // ignore
    }
  }

  const host = req.headers.host;
  if (typeof host === "string" && host.trim()) {
    const xfProto = (req.headers["x-forwarded-proto"] as string | undefined) || "";
    const proto = xfProto.toLowerCase() === "https" ? "https" : "http";
    return `${proto}://${host.trim()}`;
  }

  return undefined;
}

function isAllowedOrigin(req: NextApiRequest): boolean {
  const o = getRequestOrigin(req);
  if (!o) return false;

  const env = process.env.AUTH_ALLOWED_ORIGINS || "";
  const list = env.split(",").map((s) => s.trim()).filter(Boolean);

  // ✅ inclure localhost + 127.0.0.1 pour éviter surprises dev
  const defaults = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3005",
    "http://127.0.0.1:3005",
  ];

  const allowed = (list.length ? list : defaults).map((s) => s.toLowerCase());
  return allowed.includes(o.toLowerCase());
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Method Not Allowed" });
    return;
  }

  if (!isAllowedOrigin(req)) {
    res.status(403).json({ ok: false, error: "Bad Origin" });
    return;
  }

  const token = ensureCsrf(req, res);
  res.status(200).json({ ok: true, csrfToken: token });
}
