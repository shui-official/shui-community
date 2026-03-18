import type { NextApiRequest } from "next";

export function assertMethod(reqMethod: string | undefined, allowed: string[]) {
  if (!reqMethod || !allowed.includes(reqMethod)) {
    const err: any = new Error("Method Not Allowed");
    err.statusCode = 405;
    throw err;
  }
}

export function getHost(req: NextApiRequest): string {
  const h = req.headers.host;
  return typeof h === "string" && h.length > 3 ? h : "localhost:3000";
}

export function requireSameOrigin(req: any) {
  const origin = String(req.headers?.origin || "").trim();
  const referer = String(req.headers?.referer || "").trim();

  const host = String(req.headers?.["x-forwarded-host"] || req.headers?.host || "").trim();
  const proto =
    String(req.headers?.["x-forwarded-proto"] || "").trim() ||
    (req.socket && req.socket.encrypted ? "https" : "http");

  const expected = host ? `${proto}://${host}` : "";

  if (!expected) {
    const err: any = new Error("Bad Origin");
    err.statusCode = 403;
    throw err;
  }

  if (origin) {
    if (origin !== expected) {
      const err: any = new Error("Bad Origin");
      err.statusCode = 403;
      throw err;
    }
    return;
  }

  if (referer) {
    if (!referer.startsWith(expected)) {
      const err: any = new Error("Bad Origin");
      err.statusCode = 403;
      throw err;
    }
    return;
  }

  const err: any = new Error("Bad Origin");
  err.statusCode = 403;
  throw err;
}

export function isString(x: any): x is string {
  return typeof x === "string" && x.length > 0;
}

export function safeJson<T>(val: any): T {
  return val as T;
}
