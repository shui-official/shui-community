import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";

type SessionPayload = {
  wallet: string;
  iat: number;
  exp: number;
};

const COOKIE_NAME = "shui_session";

function b64url(buf: Buffer) {
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function b64urlJson(obj: any) {
  return b64url(Buffer.from(JSON.stringify(obj), "utf8"));
}

function sign(data: string, secret: string) {
  return b64url(crypto.createHmac("sha256", secret).update(data).digest());
}

function timingSafeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function parseCookie(cookieHeader: string, name: string) {
  const parts = cookieHeader.split(";").map((p) => p.trim());
  for (const p of parts) {
    if (p.startsWith(name + "=")) return p.slice(name.length + 1);
  }
  return null;
}

export function setSessionCookie(res: NextApiResponse, wallet: string, maxAgeSeconds = 60 * 60 * 24) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Missing SESSION_SECRET");

  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = { wallet, iat: now, exp: now + maxAgeSeconds };

  const p = b64urlJson(payload);
  const sig = sign(p, secret);
  const token = `${p}.${sig}`;

  const isProd = process.env.NODE_ENV === "production";

  res.setHeader("Set-Cookie", [
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}; ${isProd ? "Secure;" : ""}`,
  ]);
}

export function clearSessionCookie(res: NextApiResponse) {
  const isProd = process.env.NODE_ENV === "production";
  res.setHeader("Set-Cookie", [
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; ${isProd ? "Secure;" : ""}`,
  ]);
}

export function getSession(req: NextApiRequest): SessionPayload | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;

  const cookie = req.headers.cookie || "";
  const token = parseCookie(cookie, COOKIE_NAME);
  if (!token) return null;

  const [p, sig] = token.split(".");
  if (!p || !sig) return null;

  const expected = sign(p, secret);
  if (!timingSafeEqual(sig, expected)) return null;

  try {
    const json = Buffer.from(p.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const payload = JSON.parse(json) as SessionPayload;
    if (!payload.wallet || !payload.exp) return null;
    if (Math.floor(Date.now() / 1000) > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
