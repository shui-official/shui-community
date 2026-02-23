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

export function requireSameOrigin(req: NextApiRequest) {
  // Anti-CSRF “pragmatique” : on refuse les POST venant d’un autre origin.
  // (utile même si l’attaquant ne peut pas signer, ça évite des calls cross-site parasites)
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const host = getHost(req);

  const ok =
    (typeof origin === "string" && origin.includes(host)) ||
    (typeof referer === "string" && referer.includes(host));

  if (!ok) {
    const err: any = new Error("Bad Origin");
    err.statusCode = 403;
    throw err;
  }
}

export function isString(x: any): x is string {
  return typeof x === "string" && x.length > 0;
}

export function safeJson<T>(val: any): T {
  return val as T;
}
