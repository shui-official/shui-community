import type { NextApiRequest, NextApiResponse } from "next";
import { assertMethod } from "../../../lib/security/validate";
import { rateLimitOrThrow } from "../../../lib/security/rateLimit";

const SWAP_URL = "https://quote-api.jup.ag/v6/swap";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    assertMethod(req.method, ["POST"]);

    rateLimitOrThrow({
      req,
      res,
      key: "jup:swap",
      limit: 30,
      windowMs: 60_000,
    });

    const { quote, userPublicKey } = req.body || {};
    if (!quote || !userPublicKey) {
      return res.status(400).json({ ok: false, error: "missing_quote_or_user" });
    }

    // Important: JUP_API_KEY reste server-side
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (process.env.JUP_API_KEY) headers["x-api-key"] = process.env.JUP_API_KEY;

    const payload = {
      quoteResponse: quote,
      userPublicKey,
      // options safe par défaut
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: "auto",
    };

    const r = await fetch(SWAP_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const text = await r.text();
    if (!r.ok) {
      return res.status(502).json({ ok: false, error: "swap_upstream_failed", status: r.status, body: text.slice(0, 800) });
    }

    const json = JSON.parse(text);

    // Jupiter retourne généralement `swapTransaction` (base64)
    const swapTransaction = json?.swapTransaction;
    if (!swapTransaction) {
      return res.status(502).json({ ok: false, error: "missing_swapTransaction", body: JSON.stringify(json).slice(0, 800) });
    }

    return res.status(200).json({ ok: true, swapTransaction });
  } catch (e: any) {
    return res.status(e?.statusCode || 500).json({ ok: false, error: e?.message || "server_error" });
  }
}
