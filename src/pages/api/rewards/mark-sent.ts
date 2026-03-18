import type { NextApiRequest, NextApiResponse } from "next";
import { assertMethod, requireSameOrigin, safeJson } from "../../../lib/security/validate";
import { getSession } from "../../../lib/security/session";
import { rewardsRepository } from "../../../lib/rewards/store/repository";
import type { MarkSentPayload } from "../../../lib/rewards/types";

function getAdminWallets(): Set<string> {
  const raw = process.env.REWARDS_ADMIN_WALLETS || "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

function toOptionalString(value: unknown): string | null {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : null;
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

    const body = safeJson<MarkSentPayload>(req.body);
    if (!body || !Array.isArray(body.entryIds) || body.entryIds.length === 0) {
      return res.status(400).json({ ok: false, error: "entry_ids_required" });
    }

    const sentAt = Number(body.sentAt || Date.now());
    const csvBatchId = toOptionalString(body.csvBatchId);
    const txRef = toOptionalString(body.txRef);

    const allLedger = rewardsRepository.getDistributionLedger();
    const targetIds = new Set(body.entryIds);

    let updatedCount = 0;
    let skippedCount = 0;

    const nextLedger = allLedger.map((entry) => {
      if (!targetIds.has(entry.id)) return entry;

      if (entry.status === "blocked") {
        skippedCount += 1;
        return entry;
      }

      if (entry.status === "completed") {
        skippedCount += 1;
        return entry;
      }

      updatedCount += 1;

      return {
        ...entry,
        amountSent: entry.amountPlanned,
        sentAt,
        csvBatchId,
        txRef,
        status: "completed" as const,
        updatedAt: Date.now(),
      };
    });

    rewardsRepository.saveDistributionLedger(nextLedger);

    const updatedEntries = nextLedger.filter((entry) => targetIds.has(entry.id));

    return res.status(200).json({
      ok: true,
      updatedCount,
      skippedCount,
      updatedEntries,
    });
  } catch (e: any) {
    const status = e?.statusCode || 500;
    return res.status(status).json({
      ok: false,
      error: e?.message || "server_error",
    });
  }
}
