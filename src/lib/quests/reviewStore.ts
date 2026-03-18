import type { Quest } from "./catalog";

export type ReviewStatus =
  | "pending"
  | "approved"
  | "rejected";

export type ReviewSubmission = {
  id: string;
  wallet: string;
  questId: string;
  proof: string;
  submittedAt: number;
  status: ReviewStatus;
  reviewers: string[];
  rejectedBy: string[];
  adminApproved: boolean;
  bootstrapApprovedByAdmin: boolean;
  adminFinalRequired: boolean;
  approvalsRequired: number;
};

type ReviewStoreState = {
  submissionsByMonth: Map<string, Map<string, ReviewSubmission>>;
};

declare global {
  // eslint-disable-next-line no-var
  var __shuiReviewStore__: ReviewStoreState | undefined;
}

const reviewStoreState: ReviewStoreState =
  globalThis.__shuiReviewStore__ ??
  (globalThis.__shuiReviewStore__ = {
    submissionsByMonth: new Map<string, Map<string, ReviewSubmission>>(),
  });

const submissionsByMonth = reviewStoreState.submissionsByMonth;

function monthKey(ts = Date.now()) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function getMonthMap(mk: string) {
  let mm = submissionsByMonth.get(mk);
  if (!mm) {
    mm = new Map<string, ReviewSubmission>();
    submissionsByMonth.set(mk, mm);
  }
  return mm;
}

function submissionId(wallet: string, questId: string, ts: number) {
  return `${wallet}:${questId}:${ts}`;
}

export function createSubmission(wallet: string, quest: Quest, proof: string, mk = monthKey()): ReviewSubmission {
  const now = Date.now();

  const sub: ReviewSubmission = {
    id: submissionId(wallet, quest.id, now),
    wallet,
    questId: quest.id,
    proof,
    submittedAt: now,
    status: "pending",
    reviewers: [],
    rejectedBy: [],
    adminApproved: false,
    bootstrapApprovedByAdmin: false,
    adminFinalRequired: quest.reviewPolicy.requiresAdminFinal,
    approvalsRequired: quest.reviewPolicy.minApprovals,
  };

  const mm = getMonthMap(mk);
  mm.set(sub.id, sub);
  return sub;
}

export function getSubmissionById(submissionId: string, mk = monthKey()): ReviewSubmission | null {
  const mm = getMonthMap(mk);
  return mm.get(submissionId) || null;
}

export function getSubmissionsByWallet(wallet: string, mk = monthKey()): ReviewSubmission[] {
  const mm = getMonthMap(mk);
  return Array.from(mm.values())
    .filter((s) => s.wallet === wallet)
    .sort((a, b) => b.submittedAt - a.submittedAt);
}


export function getAllSubmissionsByWallet(wallet: string, mk = monthKey()): ReviewSubmission[] {
  const mm = getMonthMap(mk);
  return Array.from(mm.values())
    .filter((s) => s.wallet === wallet)
    .sort((a, b) => b.submittedAt - a.submittedAt);
}

export function getPendingSubmissions(mk = monthKey()): ReviewSubmission[] {
  const mm = getMonthMap(mk);
  return Array.from(mm.values())
    .filter((s) => s.status === "pending")
    .sort((a, b) => b.submittedAt - a.submittedAt);
}

export function approveSubmission(
  submissionId: string,
  reviewerWallet: string,
  isAdmin = false,
  bootstrapMode = false,
  mk = monthKey()
) {
  const mm = getMonthMap(mk);
  const sub = mm.get(submissionId);
  if (!sub) throw new Error("submission_not_found");
  if (sub.status !== "pending") return sub;

  if (isAdmin) {
    if (bootstrapMode) {
      sub.bootstrapApprovedByAdmin = true;
      sub.adminApproved = true;
      sub.status = "approved";
      mm.set(submissionId, sub);
      return sub;
    }

    sub.adminApproved = true;
  } else {
    if (!sub.reviewers.includes(reviewerWallet)) {
      sub.reviewers.push(reviewerWallet);
    }
  }

  const enoughApprovals = sub.reviewers.length >= sub.approvalsRequired;

  if (enoughApprovals) {
    if (!sub.adminFinalRequired || sub.adminApproved) {
      sub.status = "approved";
    }
  }

  mm.set(submissionId, sub);
  return sub;
}

export function rejectSubmission(submissionId: string, reviewerWallet: string, mk = monthKey()) {
  const mm = getMonthMap(mk);
  const sub = mm.get(submissionId);
  if (!sub) throw new Error("submission_not_found");
  if (sub.status !== "pending") return sub;

  if (!sub.rejectedBy.includes(reviewerWallet)) {
    sub.rejectedBy.push(reviewerWallet);
  }

  sub.status = "rejected";
  mm.set(submissionId, sub);
  return sub;
}
