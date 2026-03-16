import type { NextApiRequest, NextApiResponse } from "next";
import { assertMethod } from "../../../lib/security/validate";
import { getSession } from "../../../lib/security/session";
import { QUESTS } from "../../../lib/quests/catalog";
import { getForcedQuestLevel, isQuestAdminWallet } from "../../../lib/quests/admin";
import { getClaimsSnapshot, hasClaimed, getCurrentMonthKey } from "../../../lib/quests/store";
import { getMaintenanceApiPayload, isDashboardApiMaintenanceEnabled } from "../../../lib/maintenance";

const DASHBOARD_MAINTENANCE_UNTIL = new Date("2026-03-19T15:11:00.000Z");
import { getSubmissionsByWallet } from "../../../lib/quests/reviewStore";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    assertMethod(req.method, ["GET"]);

    if (isDashboardApiMaintenanceEnabled()) {
      return res.status(503).json(getMaintenanceApiPayload(req));
    }

    if (new Date() < DASHBOARD_MAINTENANCE_UNTIL) {
      return res.status(503).json({
        ok: false,
        error: "dashboard_maintenance",
        maintenance: true,
        until: DASHBOARD_MAINTENANCE_UNTIL.toISOString(),
      });
    }

    const session = getSession(req);
    if (!session) return res.status(401).json({ ok: false, error: "unauthorized" });

    const mk = getCurrentMonthKey();
    const snapshot = getClaimsSnapshot(session.wallet, mk);
    const submissions = getSubmissionsByWallet(session.wallet, mk);

    const quests = QUESTS.map((q) => ({
      id: q.id,
      titleKey: q.titleKey,
      descriptionKey: q.descriptionKey,
      proofHintKey: q.proofHintKey,
      kind: q.kind,
      category: q.category,
      verification: q.verification,
      validationLevel: q.validationLevel,
      cooldown: q.cooldown,
      points: q.points,
      requiredLevel: q.requiredLevel,
      abuseRisk: q.abuseRisk,
      mobileSyncable: q.mobileSyncable,
      tags: q.tags,
      reviewPolicy: q.reviewPolicy,
      claimed: hasClaimed(session.wallet, q, mk),
    }));

    return res.status(200).json({
      ok: true,
      month: mk,
      wallet: session.wallet,
      points: snapshot.points,
      forcedLevel: getForcedQuestLevel(session.wallet),
      isQuestAdmin: isQuestAdminWallet(session.wallet),
      quests,
      submissions,
      updatedAt: snapshot.updatedAt,
    });
  } catch (e: any) {
    const status = e?.statusCode || 500;
    return res.status(status).json({ ok: false, error: e?.message || "server_error" });
  }
}
