import { useEffect, useState } from "react";

export type MeRes = { ok: boolean; wallet?: string; exp?: number; error?: string };

let current: MeRes = { ok: false };
let listeners = new Set<(v: MeRes) => void>();
let timer: any = null;
let inflight = false;

async function fetchMeOnce() {
  if (inflight) return;
  inflight = true;
  try {
    const r = await fetch("/api/auth/me", { credentials: "include" });
    const j = (await r.json()) as MeRes;
    current = j;
  } catch {
    current = { ok: false, error: "network_error" };
  } finally {
    inflight = false;
    for (const cb of listeners) cb(current);
  }
}

function startPolling() {
  if (timer) return;
  fetchMeOnce();
  timer = setInterval(fetchMeOnce, 20_000);
}

function stopPollingIfIdle() {
  if (listeners.size === 0 && timer) {
    clearInterval(timer);
    timer = null;
  }
}

export function useSessionMe(enabled: boolean) {
  const [me, setMe] = useState<MeRes>(current);

  useEffect(() => {
    if (!enabled) return;
    listeners.add(setMe);
    startPolling();
    // push current immediately
    setMe(current);

    return () => {
      listeners.delete(setMe);
      stopPollingIfIdle();
    };
  }, [enabled]);

  return me;
}
