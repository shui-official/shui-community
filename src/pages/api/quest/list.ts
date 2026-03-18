import type { NextApiRequest, NextApiResponse } from "next";
import { assertMethod } from "../../../lib/security/validate";
import { getSession } from "../../../lib/security/session";
import { QUESTS, canReviewQuest, getLevel } from "../../../lib/quests/catalog";
import { getForcedQuestLevel, isQuestAdminWallet } from "../../../lib/quests/admin";
import { getClaimsSnapshot, hasClaimed, getCurrentMonthKey } from "../../../lib/quests/store";
import { getMaintenanceApiPayload, isDashboardApiMaintenanceEnabled } from "../../../lib/maintenance";

import { getAllSubmissionsByWallet, getPendingSubmissions } from "../../../lib/quests/reviewStore";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    assertMethod(req.method, ["GET"]);

    if (isDashboardApiMaintenanceEnabled()) {
      return res.status(503).json(getMaintenanceApiPayload(req));
    }

    const session = getSession(req);
    if (!session) return res.status(401).json({ ok: false, error: "unauthorized" });

    const mk = getCurrentMonthKey();
    const snapshot = getClaimsSnapshot(session.wallet, mk);
    const forcedLevel = getForcedQuestLevel(session.wallet);
    const isQuestAdmin = isQuestAdminWallet(session.wallet);
    const reviewerLevel = (forcedLevel || "goutte") as "goutte" | "flux" | "riviere" | "ocean";
    const submissions = getAllSubmissionsByWallet(session.wallet, mk);

    const pendingSubmissions = getPendingSubmissions(mk).filter((sub) => {
      const quest = QUESTS.find((q) => q.id === sub.questId);
      if (!quest) return false;
      if (isQuestAdmin) return true;
      return canReviewQuest(quest, reviewerLevel);
    });

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
      forcedLevel,
      isQuestAdmin,
      quests,
      submissions,
      pendingSubmissions,
      updatedAt: snapshot.updatedAt,
    });
  } catch (e: any) {
    const status = e?.statusCode || 500;
    return res.status(status).json({ ok: false, error: e?.message || "server_error" });
  }
}
