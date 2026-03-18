import type { NextApiRequest, NextApiResponse } from "next";
import { assertMethod, requireSameOrigin, safeJson } from "../../../lib/security/validate";
import { getSession } from "../../../lib/security/session";
import { resetWalletClaimsForMonth, setWalletPointsForMonth } from "../../../lib/quests/store";
import type { RewardPeriod } from "../../../lib/rewards/types";

type SeedBody = {
  period?: RewardPeriod;
  reset?: boolean;
};

function getAdminWallets(): Set<string> {
  const raw = process.env.REWARDS_ADMIN_WALLETS || "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

function getCurrentPeriod(): RewardPeriod {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}` as RewardPeriod;
}

function buildSeedWallets(adminWallet: string) {
  return [
    {
      wallet: adminWallet,
      activity: 180,
      onchain: 70,
    },
    {
      wallet: "9xQeWvG816bUx9EPjHmaT23yvVMi8iD7hN8i5n7x4bYh",
      activity: 120,
      onchain: 40,
    },
    {
      wallet: "7YttLkHDoY8UtkWxppWKqhzyap5mpQxb38nSxrdbidK5",
      activity: 260,
      onchain: 110,
    },
    {
      wallet: "6XWjMSt9uMKfJ3bp8Y7Wm8oJ4n2c8d2K9vRjG8nM3aQp",
      activity: 90,
      onchain: 20,
    },
    {
      wallet: "invalid-wallet-demo",
      activity: 140,
      onchain: 15,
    },
  ];
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    assertMethod(req.method, ["POST"]);
    requireSameOrigin(req);

    const session = getSession(req);
    if (!session) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }

    const admins = getAdminWallets();
    if (!admins.has(session.wallet)) {
      return res.status(403).json({ ok: false, error: "forbidden" });
    }

    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ ok: false, error: "disabled_in_production" });
    }

    const body = safeJson<SeedBody>(req.body) || {};
    const period = body.period || getCurrentPeriod();
    const reset = Boolean(body.reset);

    const rows = buildSeedWallets(session.wallet);

    for (const row of rows) {
      if (reset) {
        resetWalletClaimsForMonth(row.wallet, period);
      }

      setWalletPointsForMonth(
        row.wallet,
        {
          activity: row.activity,
          onchain: row.onchain,
        },
        period
      );
    }

    return res.status(200).json({
      ok: true,
      seeded: true,
      period,
      rows: rows.map((row) => ({
        wallet: row.wallet,
        activity: row.activity,
        onchain: row.onchain,
        total: row.activity + row.onchain,
      })),
    });
  } catch (e: any) {
    const status = e?.statusCode || 500;
    return res.status(status).json({
      ok: false,
      error: e?.message || "server_error",
    });
  }
}
