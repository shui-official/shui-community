import type { NextApiRequest, NextApiResponse } from "next";
import { assertMethod, isString, requireSameOrigin, safeJson } from "../../../lib/security/validate";
import { getSession } from "../../../lib/security/session";
import { isQuestAdminWallet, getForcedQuestLevel } from "../../../lib/quests/admin";
import { QUESTS, canReviewQuest, getLevel, getReviewerPoints, Quest } from "../../../lib/quests/catalog";
import { getClaimsSnapshot, getCurrentMonthKey, claimQuest, awardActivityPoints } from "../../../lib/quests/store";
import { isBootstrapReviewModeEnabled } from "../../../lib/quests/bootstrap";
import {
  getSubmissionById,
  approveSubmission,
  rejectSubmission,
} from "../../../lib/quests/reviewStore";

type Body = {
  action: "approve" | "reject";
  submissionId: string;
};

function getStaticQuestPoints(quest: Quest): number {
  if (quest.points.mode === "fixed") return quest.points.points;
  if (quest.points.mode === "range") return quest.points.min;
  return 0;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    assertMethod(req.method, ["POST"]);
    requireSameOrigin(req);

    const session = getSession(req);
    if (!session) return res.status(401).json({ ok: false, error: "unauthorized" });

    const body = safeJson<Body>(req.body);
    const action = body.action;
    const submissionId = body.submissionId;

    if (!isString(action) || !["approve", "reject"].includes(action)) {
      return res.status(400).json({ ok: false, error: "invalid_action" });
    }
    if (!isString(submissionId)) {
      return res.status(400).json({ ok: false, error: "submission_id_required" });
    }

    const mk = getCurrentMonthKey();
    const sub = getSubmissionById(submissionId, mk);
    if (!sub) return res.status(404).json({ ok: false, error: "submission_not_found" });

    const quest = QUESTS.find((q) => q.id === sub.questId);
    if (!quest) return res.status(404).json({ ok: false, error: "quest_not_found" });

    if (sub.wallet === session.wallet) {
      return res.status(403).json({ ok: false, error: "self_review_forbidden" });
    }

    const isAdmin = isQuestAdminWallet(session.wallet);
    const reviewerSnapshot = getClaimsSnapshot(session.wallet, mk);
    const forcedLevel = getForcedQuestLevel(session.wallet);
    const reviewerLevel = (forcedLevel || getLevel(reviewerSnapshot.points.total || 0)) as "goutte" | "flux" | "riviere" | "ocean";

    const canReview = isAdmin || canReviewQuest(quest, reviewerLevel);
    if (!canReview) {
      return res.status(403).json({ ok: false, error: "not_allowed_to_review" });
    }

    if (action === "reject") {
      const updated = rejectSubmission(submissionId, session.wallet, mk);
      return res.status(200).json({ ok: true, submission: updated });
    }

    const bootstrapMode = isBootstrapReviewModeEnabled();
    const updated = approveSubmission(submissionId, session.wallet, isAdmin, bootstrapMode, mk);

    let reviewerPointsAwarded = 0;
    if (reviewerLevel === "flux" || reviewerLevel === "riviere" || reviewerLevel === "ocean") {
      const reviewerPoints = getReviewerPoints(quest, reviewerLevel);
      const award = awardActivityPoints(session.wallet, `review-approve:${submissionId}:${session.wallet}`, reviewerPoints, mk);
      if (!award.alreadyAwarded) reviewerPointsAwarded = reviewerPoints;
    }

    if (updated.status === "approved") {
      const questPoints = getStaticQuestPoints(quest);
      if (questPoints > 0) {
        claimQuest(sub.wallet, quest, questPoints, mk);
      }
    }

    return res.status(200).json({
      ok: true,
      submission: updated,
      reviewerPointsAwarded,
    });
  } catch (e: any) {
    const status = e?.statusCode || 500;
    return res.status(status).json({ ok: false, error: e?.message || "server_error" });
  }
}
