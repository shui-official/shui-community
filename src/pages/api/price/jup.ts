import type { NextApiRequest, NextApiResponse } from "next";
import { assertMethod } from "../../../lib/security/validate";
import { rateLimitOrThrow } from "../../../lib/security/rateLimit";

function isMint(s: any): s is string {
  return typeof s === "string" && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    assertMethod(req.method, ["GET"]);

    rateLimitOrThrow({
      req,
      res,
      key: "price:jup",
      limit: 60,
      windowMs: 60_000,
    });

    const idsParam = Array.isArray(req.query.ids) ? req.query.ids[0] : req.query.ids;
    if (!idsParam || typeof idsParam !== "string") {
      return res.status(400).json({ ok: false, error: "missing_ids" });
    }

    // Supporte: ids=<mint> ou ids=<mint1>,<mint2>
    const ids = idsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!ids.length || ids.some((m) => !isMint(m))) {
      return res.status(400).json({ ok: false, error: "bad_ids" });
    }

    const apiKey = process.env.JUP_API_KEY || "";
    if (!apiKey) {
      return res.status(500).json({ ok: false, error: "missing_jup_api_key" });
    }

    const url = `https://api.jup.ag/price/v3?ids=${encodeURIComponent(ids.join(","))}`;

    const upstream = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        // Jupiter: clé API requise pour éviter 401 sur certains plans
        "x-api-key": apiKey,
      },
    });

    const text = await upstream.text();

    // Cache court (évite spam API)
    res.setHeader("Cache-Control", "s-maxage=15, stale-while-revalidate=60");

    if (!upstream.ok) {
      return res.status(upstream.status).json({ ok: false, error: `jup_${upstream.status}`, body: text.slice(0, 300) });
    }

    // Retour brut JSON Jupiter
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(200).send(text);
  } catch (e: any) {
    const status = e?.statusCode || 500;
    return res.status(status).json({ ok: false, error: e?.message || "server_error" });
  }
}
