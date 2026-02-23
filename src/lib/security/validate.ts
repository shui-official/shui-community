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
  // Anti-CSRF: si Origin est présent, il doit matcher exactement l'origine attendue.
  // Si Origin est absent (curl / certains contextes), on tolère et on se base sur Host.
  const origin = String(req.headers?.origin || "");
  const referer = String(req.headers?.referer || "");

  const host = String(req.headers?.["x-forwarded-host"] || req.headers?.host || "");
  const proto =
    String(req.headers?.["x-forwarded-proto"] || "") ||
    (req.socket && req.socket.encrypted ? "https" : "http");

  const expected = host ? `${proto}://${host}` : "";

  // 1) Si Origin est présent, il doit matcher expected
  if (origin) {
    if (!expected || origin !== expected) {
      const err: any = new Error("Bad Origin");
      err.statusCode = 403;
      throw err;
    }
    return;
  }

  // 2) Si Origin absent mais Referer présent, il doit commencer par expected
  if (referer) {
    if (!expected || !referer.startsWith(expected)) {
      const err: any = new Error("Bad Origin");
      err.statusCode = 403;
      throw err;
    }
    return;
  }

  // 3) Origin + Referer absents => on tolère (ex: curl) et on laisse la session + SameSite protéger.
  return;
}


export function isString(x: any): x is string {
  return typeof x === "string" && x.length > 0;
}

export function safeJson<T>(val: any): T {
  return val as T;
}
