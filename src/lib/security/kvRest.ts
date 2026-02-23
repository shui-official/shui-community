// src/lib/security/kvRest.ts
/**
 * Minimal KV client:
 * - Local dev fallback: in-memory with TTL
 * - Prod: Upstash/Vercel KV REST via KV_REST_API_URL + KV_REST_API_TOKEN
 *
 * We only need one atomic op: SET key "1" NX EX <ttl>
 */

type MemEntry = { value: string; expiresAt: number };
const mem = new Map<string, MemEntry>();

function nowMs() {
  return Date.now();
}

function memGet(key: string): string | null {
  const e = mem.get(key);
  if (!e) return null;
  if (e.expiresAt <= nowMs()) {
    mem.delete(key);
    return null;
  }
  return e.value;
}

function memSetNxEx(key: string, value: string, ttlSec: number): boolean {
  if (memGet(key) !== null) return false;
  mem.set(key, { value, expiresAt: nowMs() + ttlSec * 1000 });
  return true;
}

function envUrl(): string | null {
  return process.env.KV_REST_API_URL || null;
}
function envToken(): string | null {
  return process.env.KV_REST_API_TOKEN || null;
}

async function upstashSetNxEx(key: string, value: string, ttlSec: number): Promise<boolean> {
  const url = envUrl();
  const token = envToken();
  if (!url || !token) return false;

  // Upstash REST supports pipeline. We use:
  // ["SET", key, value, "NX", "EX", ttlSec]
  const endpoint = `${url.replace(/\/+$/, "")}/pipeline`;

  const r = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([["SET", key, value, "NX", "EX", String(ttlSec)]]),
  });

  if (!r.ok) return false;

  const j = (await r.json()) as Array<{ result?: any; error?: string }>;
  const first = j && j[0];
  return !!first && first.result === "OK";
}

export async function setUsedOnce(key: string, ttlSec: number): Promise<boolean> {
  // Try external KV first; fallback to memory.
  const okRemote = await upstashSetNxEx(key, "1", ttlSec);
  if (okRemote) return true;

  // If KV env not configured, use memory fallback
  return memSetNxEx(key, "1", ttlSec);
}
