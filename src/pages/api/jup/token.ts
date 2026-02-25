import type { NextApiRequest, NextApiResponse } from "next";
import { assertMethod } from "../../../lib/security/validate";
import { rateLimitOrThrow } from "../../../lib/security/rateLimit";

const JUP_TOKEN_URL = "https://token.jup.ag/strict";

let cache: { at: number; map: Record<string, { decimals: number; symbol?: string; name?: string }> } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    assertMethod(req.method, ["GET"]);

    rateLimitOrThrow({
      req,
      res,
      key: "jup:token",
      limit: 60,
      windowMs: 60_000,
    });

    const mint = String(req.query.mint || "").trim();
    if (!mint) return res.status(400).json({ ok: false, error: "missing_mint" });

    const now = Date.now();
    if (!cache || now - cache.at > CACHE_TTL_MS) {
      const r = await fetch(JUP_TOKEN_URL, { method: "GET", headers: { Accept: "application/json" } });
      if (!r.ok) return res.status(502).json({ ok: false, error: "token_upstream_failed", status: r.status });

      const list = (await r.json()) as any[];
      const map: Record<string, { decimals: number; symbol?: string; name?: string }> = {};
      for (const t of list) {
        if (t?.address && typeof t.decimals === "number") {
          map[String(t.address)] = { decimals: t.decimals, symbol: t.symbol, name: t.name };
        }
      }
      cache = { at: now, map };
    }

    const info = cache.map[mint];
    if (!info) return res.status(404).json({ ok: false, error: "mint_not_found" });

    res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=600");
    return res.status(200).json({ ok: true, mint, ...info });
  } catch (e: any) {
    return res.status(e?.statusCode || 500).json({ ok: false, error: e?.message || "server_error" });
  }
}
