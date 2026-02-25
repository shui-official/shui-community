import type { NextApiRequest, NextApiResponse } from "next";
import { assertMethod } from "../../../lib/security/validate";
import { rateLimitOrThrow } from "../../../lib/security/rateLimit";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    assertMethod(req.method, ["GET"]);

    rateLimitOrThrow({
      req,
      res,
      key: "health:jup",
      limit: 30,
      windowMs: 60_000,
    });

    const hasJupApiKey = Boolean(process.env.JUP_API_KEY);

    // (Optionnel) ping Jupiter price API pour valider que la clé est acceptée
    // Sans exposer la clé. On teste un endpoint public.
    let upstreamOk: boolean | null = null;
    let upstreamStatus: number | null = null;

    if (hasJupApiKey) {
      try {
        const upstream = await fetch("https://api.jup.ag/price/v3?ids=So11111111111111111111111111111111111111112", {
          method: "GET",
          headers: {
            Accept: "application/json",
            "x-api-key": process.env.JUP_API_KEY as string,
          },
        });
        upstreamOk = upstream.ok;
        upstreamStatus = upstream.status;
      } catch {
        upstreamOk = false;
        upstreamStatus = null;
      }
    }

    // Cache court côté edge (Vercel) pour éviter spam
    res.setHeader("Cache-Control", "s-maxage=15, stale-while-revalidate=60");

    return res.status(200).json({
      ok: true,
      hasJupApiKey,
      upstreamOk,
      upstreamStatus,
      nodeEnv: process.env.NODE_ENV || null,
    });
  } catch (e: any) {
    const status = e?.statusCode || 500;
    return res.status(status).json({ ok: false, error: e?.message || "server_error" });
  }
}
