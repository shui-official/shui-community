import crypto from "crypto";

type LinkPayload = { w: string; exp: number };

const COOKIE_SAFE_B64 = (s: string) =>
  Buffer.from(s, "utf8")
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

function b64urlToJson<T>(b64url: string): T | null {
  try {
    const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(b64, "base64").toString("utf8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

function hmac(secret: string, data: string): string {
  return COOKIE_SAFE_B64(crypto.createHmac("sha256", secret).update(data).digest("base64"));
}

/**
 * In-memory link store:
 * wallet -> telegramUserId
 * (OK pour dev + démo ; en prod on passera sur KV/DB si besoin)
 */
const walletToTelegram = new Map<string, number>();

export function setTelegramLink(wallet: string, telegramUserId: number) {
  walletToTelegram.set(wallet, telegramUserId);
}

export function getTelegramLink(wallet: string): number | null {
  return walletToTelegram.get(wallet) ?? null;
}

export function createTelegramStartToken(wallet: string, secret: string, ttlSeconds = 10 * 60) {
  const now = Math.floor(Date.now() / 1000);
  const payload: LinkPayload = { w: wallet, exp: now + ttlSeconds };
  const payloadB64 = COOKIE_SAFE_B64(JSON.stringify(payload));
  const sig = hmac(secret, payloadB64);
  return `${payloadB64}.${sig}`;
}

export function verifyTelegramStartToken(token: string, secret: string): string | null {
  if (!token || typeof token !== "string") return null;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;

  const expected = hmac(secret, payloadB64);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;

  const payload = b64urlToJson<LinkPayload>(payloadB64);
  if (!payload?.w || typeof payload.exp !== "number") return null;

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) return null;

  return payload.w;
}

export async function isTelegramMember(opts: { botToken: string; chatId: string; userId: number }) {
  const { botToken, chatId, userId } = opts;

  const url = `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${encodeURIComponent(
    chatId
  )}&user_id=${encodeURIComponent(String(userId))}`;

  const r = await fetch(url, { method: "GET" });
  const j: any = await r.json().catch(() => ({}));

  if (!r.ok || !j?.ok) {
    return { ok: false as const, error: "telegram_api_error", details: j };
  }

  const status = j?.result?.status as string | undefined;
  // statuses: creator, administrator, member, restricted, left, kicked
  const isMember = status === "creator" || status === "administrator" || status === "member";
  if (!isMember) return { ok: false as const, error: "not_member", status };

  return { ok: true as const, status };
}
