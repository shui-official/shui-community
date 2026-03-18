import type { NextApiRequest, NextApiResponse } from "next";
import { assertMethod } from "../../../lib/security/validate";
import { getSession } from "../../../lib/security/session";
import { getUserRewardsSummary } from "../../../lib/rewards/selectors";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    assertMethod(req.method, ["GET"]);

    const session = getSession(req);
    if (!session) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }

    const summary = getUserRewardsSummary(session.wallet);

    return res.status(200).json({
      ok: true,
      summary,
    });
  } catch (e: any) {
    const status = e?.statusCode || 500;
    return res.status(status).json({
      ok: false,
      error: e?.message || "server_error",
    });
  }
}
