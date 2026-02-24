import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";

const CSRF_COOKIE = "shui_csrf";
const CSRF_TTL_SEC = 2 * 60 * 60; // 2h

function parseCookie(cookieHeader: string, name: string) {
  const parts = cookieHeader.split(";").map((p) => p.trim());
  for (const p of parts) {
    if (p.startsWith(name + "=")) return p.slice(name.length + 1);
  }
  return null;
}

function timingSafeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function newToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function isHttpsRequest(req: NextApiRequest): boolean {
  const xfProto = (req.headers["x-forwarded-proto"] as string | undefined) || "";
  if (xfProto.toLowerCase() === "https") return true;
  return false;
}

export function getCsrfCookie(req: NextApiRequest): string | null {
  const cookie = req.headers.cookie || "";
  return parseCookie(cookie, CSRF_COOKIE);
}

export function setCsrfCookie(req: NextApiRequest, res: NextApiResponse, token: string) {
  const secure = isHttpsRequest(req) || process.env.NODE_ENV === "production";
  const parts = [
    `${CSRF_COOKIE}=${token}`,
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${CSRF_TTL_SEC}`,
    secure ? "Secure" : "",
  ].filter(Boolean);

  res.setHeader("Set-Cookie", parts.join("; "));
}

export function ensureCsrf(req: NextApiRequest, res: NextApiResponse): string {
  const existing = getCsrfCookie(req);
  if (existing && existing.length >= 20) return existing;
  const token = newToken();
  setCsrfCookie(req, res, token);
  return token;
}

export function requireCsrf(req: NextApiRequest, res: NextApiResponse): boolean {
  const cookieToken = getCsrfCookie(req);
  const headerToken = (req.headers["x-csrf-token"] as string | undefined) || "";

  if (!cookieToken || !headerToken) {
    res.status(403).json({ ok: false, error: "csrf_required" });
    return false;
  }
  if (!timingSafeEqual(cookieToken, headerToken)) {
    res.status(403).json({ ok: false, error: "csrf_invalid" });
    return false;
  }
  return true;
}
