import type { NextApiRequest, NextApiResponse } from "next";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function getIp(req: NextApiRequest): string {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length) return xff.split(",")[0].trim();
  const xr = req.headers["x-real-ip"];
  if (typeof xr === "string" && xr.length) return xr.trim();
  return req.socket.remoteAddress || "unknown";
}

export function rateLimitOrThrow(opts: {
  req: NextApiRequest;
  res: NextApiResponse;
  key: string;         // ex: "auth:nonce"
  limit: number;       // ex: 20
  windowMs: number;    // ex: 60_000
}) {
  const ip = getIp(opts.req);
  const now = Date.now();
  const k = `${opts.key}:${ip}`;

  const current = buckets.get(k);
  if (!current || now > current.resetAt) {
    buckets.set(k, { count: 1, resetAt: now + opts.windowMs });
    setHeaders(opts.res, opts.limit - 1, opts.windowMs);
    return;
  }

  if (current.count >= opts.limit) {
    const retry = Math.max(0, current.resetAt - now);
    opts.res.setHeader("Retry-After", Math.ceil(retry / 1000));
    const err: any = new Error("Too Many Requests");
    err.statusCode = 429;
    throw err;
  }

  current.count += 1;
  buckets.set(k, current);
  setHeaders(opts.res, opts.limit - current.count, current.resetAt - now);
}

function setHeaders(res: NextApiResponse, remaining: number, resetMs: number) {
  res.setHeader("X-RateLimit-Remaining", String(Math.max(0, remaining)));
  res.setHeader("X-RateLimit-Reset", String(Math.ceil(resetMs / 1000)));
}
