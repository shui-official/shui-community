import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { PublicKey } from "@solana/web3.js";
import { requireCsrf } from "../../../lib/security/csrf";

const NONCE_TTL_MS = 5 * 60 * 1000;

const RL_LIMIT = 20;
const RL_WINDOW_SEC = 60;

type RLState = { count: number; resetAt: number };
const rl = new Map<string, RLState>();

function getClientIp(req: NextApiRequest): string {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.length > 0) return xf.split(",")[0].trim();
  return req.socket.remoteAddress || "unknown";
}

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

function isAllowedOrigin(req: NextApiRequest): { ok: true; origin: string } | { ok: false } {
  const o = getRequestOrigin(req);
  if (!o) return { ok: false };

  const env = process.env.AUTH_ALLOWED_ORIGINS || "";
  const list = env.split(",").map((s) => s.trim()).filter(Boolean);

  const defaults = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3005",
    "http://127.0.0.1:3005",
  ];

  const allowed = (list.length ? list : defaults).map((s) => s.toLowerCase());
  if (!allowed.includes(o.toLowerCase())) return { ok: false };
  return { ok: true, origin: o };
}

function parseWallet(input: unknown): { ok: true; wallet: string } | { ok: false; error: string } {
  if (typeof input !== "string") return { ok: false, error: "wallet_required" };
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: "wallet_required" };
  if (/\s/.test(trimmed)) return { ok: false, error: "wallet_invalid" };

  try {
    const pk = new PublicKey(trimmed);
    const canon = pk.toBase58();
    if (canon !== trimmed) return { ok: false, error: "wallet_invalid" };
    return { ok: true, wallet: canon };
  } catch {
    return { ok: false, error: "wallet_invalid" };
  }
}

function rateLimit(req: NextApiRequest, res: NextApiResponse): boolean {
  const ip = getClientIp(req);
  const now = Date.now();
  const resetAt = now + RL_WINDOW_SEC * 1000;

  const cur = rl.get(ip);
  if (!cur || now > cur.resetAt) {
    rl.set(ip, { count: 1, resetAt });
    res.setHeader("X-RateLimit-Remaining", String(RL_LIMIT - 1));
    res.setHeader("X-RateLimit-Reset", String(RL_WINDOW_SEC));
    return true;
  }

  if (cur.count >= RL_LIMIT) {
    const secsLeft = Math.max(1, Math.ceil((cur.resetAt - now) / 1000));
    res.setHeader("X-RateLimit-Remaining", "0");
    res.setHeader("X-RateLimit-Reset", String(secsLeft));
    res.status(429).json({ ok: false, error: "rate_limited" });
    return false;
  }

  cur.count += 1;
  rl.set(ip, cur);
  res.setHeader("X-RateLimit-Remaining", String(Math.max(0, RL_LIMIT - cur.count)));
  res.setHeader("X-RateLimit-Reset", String(Math.max(1, Math.ceil((cur.resetAt - now) / 1000))));
  return true;
}

function makeHex(bytes: number): string {
  return crypto.randomBytes(bytes).toString("hex");
}

function buildLoginMessage(args: {
  origin: string;
  wallet: string;
  nonce: string;
  issuedAt: number;
  expiresAt: number;
}): string {
  const url = new URL(args.origin);
  const domain = url.host;

  return [
    `SHUI (水) — Sign-in`,
    ``,
    `Domain: ${domain}`,
    `URI: ${args.origin}`,
    `Action: login`,
    `Wallet: ${args.wallet}`,
    `Nonce: ${args.nonce}`,
    `Issued At: ${new Date(args.issuedAt).toISOString()}`,
    `Expires At: ${new Date(args.expiresAt).toISOString()}`,
    ``,
    `No blockchain transaction will be sent.`,
  ].join("\n");
}

function signToken(payload: object, secret: string): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method Not Allowed" });
    return;
  }

  const o = isAllowedOrigin(req);
  if (!o.ok) {
    res.status(403).json({ ok: false, error: "Bad Origin" });
    return;
  }

  // ✅ CSRF obligatoire
  if (!requireCsrf(req, res)) return;

  if (!rateLimit(req, res)) return;

  const walletRaw = (req.body && (req.body as any).wallet) ?? undefined;
  const parsed = parseWallet(walletRaw);
  if (parsed.ok === false) {
    res.status(400).json({ ok: false, error: parsed.error });
    return;
  }

  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    res.status(500).json({ ok: false, error: "server_misconfigured" });
    return;
  }

  const nonce = makeHex(16);
  const jti = makeHex(16);
  const issuedAt = Date.now();
  const expiresAt = issuedAt + NONCE_TTL_MS;

  const message = buildLoginMessage({ origin: o.origin, wallet: parsed.wallet, nonce, issuedAt, expiresAt });

  const nonceToken = signToken(
    {
      wallet: parsed.wallet,
      nonce,
      jti,
      iat: issuedAt,
      exp: expiresAt,
      origin: o.origin,
    },
    secret
  );

  res.status(200).json({ ok: true, wallet: parsed.wallet, nonce, issuedAt, expiresAt, message, nonceToken });
}
