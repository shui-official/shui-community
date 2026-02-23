import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { PublicKey } from "@solana/web3.js";
import { setUsedOnce } from "../../../lib/security/kvRest";

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

function verifyToken(token: string, secret: string): any | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;

  const expected = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }

  try {
    const json = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!json || typeof json.wallet !== "string") return null;
    if (typeof json.nonce !== "string") return null;
    if (typeof json.jti !== "string") return null;
    if (typeof json.origin !== "string") return null;
    if (typeof json.exp !== "number" || Date.now() > json.exp) return null;
    if (typeof json.iat !== "number") return null;
    return json;
  } catch {
    return null;
  }
}

function signSession(payload: object, secret: string): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function setSessionCookie(res: NextApiResponse, token: string) {
  const secure = process.env.NODE_ENV === "production";
  const parts = [
    `shui_session=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    secure ? "Secure" : "",
    `Max-Age=${7 * 24 * 60 * 60}`,
  ].filter(Boolean);

  res.setHeader("Set-Cookie", parts.join("; "));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method Not Allowed" });
    return;
  }

  const origin = req.headers.origin;
  if (!isAllowedOrigin(origin)) {
    res.status(403).json({ ok: false, error: "Bad Origin" });
    return;
  }

  const walletRaw = (req.body && (req.body as any).wallet) ?? undefined;
  const sigRaw = (req.body && (req.body as any).signature) ?? undefined;
  const nonceTokenRaw = (req.body && (req.body as any).nonceToken) ?? undefined;

  const parsedWallet = parseWallet(walletRaw);
  if (parsedWallet.ok === false) {
    res.status(400).json({ ok: false, error: parsedWallet.error });
    return;
  }

  if (typeof nonceTokenRaw !== "string" || nonceTokenRaw.trim().length < 20) {
    res.status(400).json({ ok: false, error: "nonceToken_required" });
    return;
  }

  if (typeof sigRaw !== "string" || sigRaw.trim().length < 40) {
    res.status(400).json({ ok: false, error: "signature_required" });
    return;
  }

  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    res.status(500).json({ ok: false, error: "server_misconfigured" });
    return;
  }

  const tokenPayload = verifyToken(nonceTokenRaw.trim(), secret);
  if (!tokenPayload) {
    res.status(401).json({ ok: false, error: "nonceToken_invalid_or_expired" });
    return;
  }

  if (tokenPayload.wallet !== parsedWallet.wallet) {
    res.status(401).json({ ok: false, error: "wallet_mismatch" });
    return;
  }
  if (tokenPayload.origin !== origin) {
    res.status(401).json({ ok: false, error: "origin_mismatch" });
    return;
  }

  // Strict anti-replay: mark jti as used once for 5 minutes.
  const usedKey = `shui:nonce_used:${tokenPayload.jti}`;
  const okSet = await setUsedOnce(usedKey, 5 * 60);
  if (!okSet) {
    res.status(401).json({ ok: false, error: "nonce_used_or_expired" });
    return;
  }

  const message = buildLoginMessage({
    origin: origin!,
    wallet: parsedWallet.wallet,
    nonce: tokenPayload.nonce,
    issuedAt: tokenPayload.iat,
    expiresAt: tokenPayload.exp,
  });

  let okSig = false;
  try {
    const msgBytes = Buffer.from(message, "utf8");
    const sigBytes = bs58.decode(sigRaw.trim());
    const pubBytes = new PublicKey(parsedWallet.wallet).toBytes();
    okSig = nacl.sign.detached.verify(msgBytes, sigBytes, pubBytes);
  } catch {
    okSig = false;
  }

  if (!okSig) {
    res.status(401).json({ ok: false, error: "signature_invalid" });
    return;
  }

  const now = Date.now();
  const sessionPayload = {
    wallet: parsedWallet.wallet,
    iat: now,
    exp: now + 7 * 24 * 60 * 60 * 1000,
  };

  const token = signSession(sessionPayload, secret);
  setSessionCookie(res, token);

  res.status(200).json({ ok: true, wallet: parsedWallet.wallet });
}
