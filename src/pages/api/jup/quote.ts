import type { NextApiRequest, NextApiResponse } from "next";
import { assertMethod } from "../../../lib/security/validate";
import { rateLimitOrThrow } from "../../../lib/security/rateLimit";

const QUOTE_URL = "https://quote-api.jup.ag/v6/quote";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    assertMethod(req.method, ["GET"]);

    rateLimitOrThrow({
      req,
      res,
      key: "jup:quote",
      limit: 60,
      windowMs: 60_000,
    });

    const inputMint = String(req.query.inputMint || "").trim();
    const outputMint = String(req.query.outputMint || "").trim();
    const amount = String(req.query.amount || "").trim(); // base units integer string
    const slippageBps = String(req.query.slippageBps || "100").trim(); // default 1%

    if (!inputMint || !outputMint || !amount) {
      return res.status(400).json({ ok: false, error: "missing_params" });
    }
    if (!/^\d+$/.test(amount)) {
      return res.status(400).json({ ok: false, error: "amount_must_be_int_string" });
    }

    const url =
      `${QUOTE_URL}?inputMint=${encodeURIComponent(inputMint)}` +
      `&outputMint=${encodeURIComponent(outputMint)}` +
      `&amount=${encodeURIComponent(amount)}` +
      `&slippageBps=${encodeURIComponent(slippageBps)}`;

    const r = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
    const text = await r.text();

    if (!r.ok) {
      return res.status(502).json({ ok: false, error: "quote_upstream_failed", status: r.status, body: text.slice(0, 500) });
    }

    res.setHeader("Cache-Control", "s-maxage=2, stale-while-revalidate=10");
    return res.status(200).json({ ok: true, quote: JSON.parse(text) });
  } catch (e: any) {
    return res.status(e?.statusCode || 500).json({ ok: false, error: e?.message || "server_error" });
  }
}
