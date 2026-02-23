import type { NextApiRequest, NextApiResponse } from "next";
import { assertMethod } from "../../../lib/security/validate";
import { rateLimitOrThrow } from "../../../lib/security/rateLimit";

function isMint(s: any): s is string {
  return typeof s === "string" && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s);
}
function isIntStr(s: any): s is string {
  return typeof s === "string" && /^[0-9]+$/.test(s);
}
function isBps(n: any): n is number {
  return typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 10_000;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    assertMethod(req.method, ["GET"]);

    rateLimitOrThrow({
      req,
      res,
      key: "quote:jup",
      limit: 60,
      windowMs: 60_000,
    });

    const inputMint = Array.isArray(req.query.inputMint) ? req.query.inputMint[0] : req.query.inputMint;
    const outputMint = Array.isArray(req.query.outputMint) ? req.query.outputMint[0] : req.query.outputMint;
    const amount = Array.isArray(req.query.amount) ? req.query.amount[0] : req.query.amount;
    const slippageBpsRaw = Array.isArray(req.query.slippageBps) ? req.query.slippageBps[0] : req.query.slippageBps;

    if (!isMint(inputMint) || !isMint(outputMint)) {
      return res.status(400).json({ ok: false, error: "bad_mint" });
    }
    if (!isIntStr(amount)) {
      return res.status(400).json({ ok: false, error: "bad_amount" });
    }

    const slippageBps = slippageBpsRaw ? Number(slippageBpsRaw) : 50;
    if (!isBps(slippageBps)) {
      return res.status(400).json({ ok: false, error: "bad_slippage_bps" });
    }

    const apiKey = process.env.JUP_API_KEY || "";
    if (!apiKey) {
      return res.status(500).json({ ok: false, error: "missing_jup_api_key" });
    }

    const url =
      `https://api.jup.ag/swap/v1/quote` +
      `?inputMint=${encodeURIComponent(inputMint)}` +
      `&outputMint=${encodeURIComponent(outputMint)}` +
      `&amount=${encodeURIComponent(amount)}` +
      `&slippageBps=${encodeURIComponent(String(slippageBps))}`;

    const upstream = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "x-api-key": apiKey,
      },
    });

    const text = await upstream.text();

    // cache court
    res.setHeader("Cache-Control", "s-maxage=15, stale-while-revalidate=60");

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        ok: false,
        error: `jup_${upstream.status}`,
        body: text.slice(0, 300),
      });
    }

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(200).send(text);
  } catch (e: any) {
    const status = e?.statusCode || 500;
    return res.status(status).json({ ok: false, error: e?.message || "server_error" });
  }
}
