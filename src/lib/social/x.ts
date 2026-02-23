import crypto from "crypto";

type XLink = {
  userId: string;
  accessToken: string;
  exp: number; // epoch seconds
};

const walletToX = new Map<string, XLink>();
let cachedTargetId: { username: string; id: string; exp: number } | null = null;

function b64url(buf: Buffer) {
  return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export function sha256b64url(input: string) {
  return b64url(crypto.createHash("sha256").update(input).digest());
}

export function randomVerifier(len = 64) {
  return b64url(crypto.randomBytes(len));
}

export function createStateToken(wallet: string, secret: string, ttlSeconds = 10 * 60) {
  const now = Math.floor(Date.now() / 1000);
  const payload = { w: wallet, exp: now + ttlSeconds, n: b64url(crypto.randomBytes(16)) };
  const payloadB64 = b64url(Buffer.from(JSON.stringify(payload), "utf8"));
  const sig = b64url(crypto.createHmac("sha256", secret).update(payloadB64).digest());
  return `${payloadB64}.${sig}`;
}

export function verifyStateToken(token: string, secret: string): string | null {
  if (!token || typeof token !== "string") return null;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;

  const expected = b64url(crypto.createHmac("sha256", secret).update(payloadB64).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;

  try {
    const json = Buffer.from(payloadB64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const payload = JSON.parse(json);
    if (!payload?.w || typeof payload.exp !== "number") return null;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) return null;
    return String(payload.w);
  } catch {
    return null;
  }
}

export function setXLink(wallet: string, link: XLink) {
  walletToX.set(wallet, link);
}

export function getXLink(wallet: string): XLink | null {
  const v = walletToX.get(wallet) || null;
  if (!v) return null;
  const now = Math.floor(Date.now() / 1000);
  if (v.exp <= now) {
    walletToX.delete(wallet);
    return null;
  }
  return v;
}

export async function fetchXMe(accessToken: string) {
  const r = await fetch("https://api.x.com/2/users/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok) return { ok: false as const, error: "x_me_failed", details: j };
  const id = j?.data?.id ? String(j.data.id) : "";
  if (!id) return { ok: false as const, error: "x_me_missing_id", details: j };
  return { ok: true as const, id };
}

export async function fetchXUserIdByUsername(accessToken: string, username: string) {
  // simple cache 1h (évite appels inutiles)
  const now = Math.floor(Date.now() / 1000);
  if (cachedTargetId && cachedTargetId.username === username && cachedTargetId.exp > now) {
    return { ok: true as const, id: cachedTargetId.id };
  }

  const r = await fetch(`https://api.x.com/2/users/by/username/${encodeURIComponent(username)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok) return { ok: false as const, error: "x_lookup_failed", details: j };
  const id = j?.data?.id ? String(j.data.id) : "";
  if (!id) return { ok: false as const, error: "x_lookup_missing_id", details: j };

  cachedTargetId = { username, id, exp: now + 3600 };
  return { ok: true as const, id };
}

export async function checkFollowing(accessToken: string, sourceUserId: string, targetUserId: string) {
  // GET /2/users/:id/following (follows.read) :contentReference[oaicite:1]{index=1}
  // Pagination possible -> on limite à quelques pages (anti rate limit)
  let pagination: string | null = null;

  for (let page = 0; page < 5; page++) {
    const url = new URL(`https://api.x.com/2/users/${encodeURIComponent(sourceUserId)}/following`);
    url.searchParams.set("max_results", "1000");
    if (pagination) url.searchParams.set("pagination_token", pagination);

    const r = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
    const j: any = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false as const, error: "x_following_failed", details: j };

    const arr: any[] = Array.isArray(j?.data) ? j.data : [];
    if (arr.some((u) => String(u?.id || "") === targetUserId)) return { ok: true as const };

    pagination = j?.meta?.next_token ? String(j.meta.next_token) : null;
    if (!pagination) break;
  }

  return { ok: false as const, error: "not_following" };
}

export function buildCookie(name: string, value: string, maxAgeSeconds: number) {
  const isProd = process.env.NODE_ENV === "production";
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (isProd) parts.push("Secure");
  return parts.join("; ");
}

export function clearCookie(name: string) {
  const isProd = process.env.NODE_ENV === "production";
  const parts = [`${name}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (isProd) parts.push("Secure");
  return parts.join("; ");
}

export function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  const parts = header.split(";").map((p) => p.trim());
  for (const p of parts) {
    const idx = p.indexOf("=");
    if (idx === -1) continue;
    const k = p.slice(0, idx);
    const v = p.slice(idx + 1);
    if (k === name) return decodeURIComponent(v);
  }
  return null;
}
