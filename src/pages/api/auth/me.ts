import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "../../../lib/security/session";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");

  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ ok: false });
  }

  return res.status(200).json({
    ok: true,
    wallet: session.wallet,
    exp: session.exp,
    iat: session.iat,
  });
}
