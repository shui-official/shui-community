type NonceEntry = {
  nonce: string;
  wallet: string;
  expiresAt: number;
  used: boolean;
};

const store = new Map<string, NonceEntry>();

export function createNonce(wallet: string, ttlMs: number) {
  const nonce = cryptoRandomHex(16);
  const expiresAt = Date.now() + ttlMs;
  store.set(nonce, { nonce, wallet, expiresAt, used: false });
  return { nonce, expiresAt };
}

export function consumeNonce(nonce: string, wallet: string) {
  const entry = store.get(nonce);
  if (!entry) return { ok: false as const, reason: "nonce_not_found" as const };
  if (entry.used) return { ok: false as const, reason: "nonce_used" as const };
  if (entry.wallet !== wallet) return { ok: false as const, reason: "wallet_mismatch" as const };
  if (Date.now() > entry.expiresAt) return { ok: false as const, reason: "nonce_expired" as const };

  entry.used = true;
  store.set(nonce, entry);
  return { ok: true as const, expiresAt: entry.expiresAt };
}

function cryptoRandomHex(bytes: number): string {
  const { randomBytes } = require("crypto");
  return randomBytes(bytes).toString("hex");
}
