import type { NextApiRequest, NextApiResponse } from "next";
import { assertMethod, isString, requireSameOrigin, safeJson } from "../../../lib/security/validate";
import { rateLimitOrThrow } from "../../../lib/security/rateLimit";
import { getSession } from "../../../lib/security/session";
import { getQuestById, Quest } from "../../../lib/quests/catalog";
import { isQuestAdminWallet } from "../../../lib/quests/admin";
import { claimQuest, getClaimsSnapshot, hasClaimed, getCurrentMonthKey } from "../../../lib/quests/store";
import { createSubmission } from "../../../lib/quests/reviewStore";
import { getMaintenanceApiPayload, isDashboardApiMaintenanceEnabled } from "../../../lib/maintenance";

import { Connection, PublicKey } from "@solana/web3.js";
import { getTelegramLink, isTelegramMember } from "../../../lib/social/telegram";
import { getXLink, fetchXUserIdByUsername, checkFollowing } from "../../../lib/social/x";

type Body = {
  action: "quest-claim";
  questId: string;
  proof?: string;
};

const ALLOWED_ACTIONS = new Set(["quest-claim"]);

const SHUI_MINT = process.env.SHUI_MINT || "CnrMgNn1N3uY6GqD6FeZRdd1uhPViEFxSioWhRZsCz4C";
const LP_MINT = process.env.RAYDIUM_LP_MINT || "";
const RPC =
  process.env.SOLANA_RPC_URL ||
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  "https://ssc-dao.genesysgo.net";

function floorAmount(x: number) {
  if (!Number.isFinite(x) || x <= 0) return 0;
  return Math.floor(x);
}

async function getSplTokenUiAmount(connection: Connection, owner: PublicKey, mint: PublicKey) {
  const res = await connection.getParsedTokenAccountsByOwner(owner, { mint });
  let sum = 0;
  for (const it of res.value) {
    const info: any = it.account.data.parsed.info;
    const ui = Number(info?.tokenAmount?.uiAmount || 0);
    if (Number.isFinite(ui)) sum += ui;
  }
  return sum;
}

async function computePointsForQuest(connection: Connection, wallet: string, quest: Quest) {
  if (quest.points.mode === "fixed") return quest.points.points;

  if (quest.points.mode === "range") return quest.points.min;

  const owner = new PublicKey(wallet);

  if (quest.points.mode === "holder-mult") {
    const mint = new PublicKey(SHUI_MINT);
    const shuiAmount = await getSplTokenUiAmount(connection, owner, mint);
    return floorAmount(shuiAmount) * quest.points.multiplier;
  }

  if (quest.points.mode === "lp-mult") {
    if (!LP_MINT) return 0;
    const mint = new PublicKey(LP_MINT);
    const lpAmount = await getSplTokenUiAmount(connection, owner, mint);
    return floorAmount(lpAmount) * quest.points.multiplier;
  }

  return 0;
}

async function verifyTelegramQuest(wallet: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
  const chatId = process.env.TELEGRAM_CHAT_ID || "";
  if (!botToken) return { ok: false as const, error: "telegram_bot_token_missing" };
  if (!chatId) return { ok: false as const, error: "telegram_chat_id_missing" };

  const userId = getTelegramLink(wallet);
  if (!userId) return { ok: false as const, error: "telegram_not_linked" };

  const v = await isTelegramMember({ botToken, chatId, userId });
  if (!v.ok) return { ok: false as const, error: "telegram_not_member" };

  return { ok: true as const };
}

async function verifyXQuest(wallet: string) {
  const target = process.env.X_TARGET_USERNAME || "Shui_Labs";
  const link = getXLink(wallet);
  if (!link) return { ok: false as const, error: "x_not_linked" };

  const targetId = await fetchXUserIdByUsername(link.accessToken, target);
  if (!targetId.ok) return { ok: false as const, error: targetId.error };

  const v = await checkFollowing(link.accessToken, link.userId, targetId.id);
  if (!v.ok) return { ok: false as const, error: v.error };

  return { ok: true as const };
}

async function verifyQuest(connection: Connection, wallet: string, quest: Quest) {
  const verif = String(quest.verification ?? "");

  if (quest.id === "join-telegram") {
    return await verifyTelegramQuest(wallet);
  }

  if (quest.id === "follow-x") {
    return await verifyXQuest(wallet);
  }

  if (
    verif === "manual" ||
    verif === "social" ||
    verif === "semi-social" ||
    verif === "semi-proof" ||
    verif === "auto-wallet" ||
    verif === "auto-quiz"
  ) {
    return { ok: true as const };
  }

  const owner = new PublicKey(wallet);

  if (verif === "onchain-hold" || verif === "auto-onchain-hold") {
    const mint = new PublicKey(SHUI_MINT);
    const shuiAmount = await getSplTokenUiAmount(connection, owner, mint);
    if (shuiAmount <= 0) return { ok: false as const, error: "not_holder" };
    return { ok: true as const };
  }

  if (verif === "onchain-lp" || verif === "auto-onchain-lp") {
    if (!LP_MINT) return { ok: false as const, error: "lp_mint_missing" };
    const mint = new PublicKey(LP_MINT);
    const lpAmount = await getSplTokenUiAmount(connection, owner, mint);
    if (lpAmount <= 0) return { ok: false as const, error: "no_lp" };
    return { ok: true as const };
  }

  return { ok: false as const, error: "verification_not_supported" };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    assertMethod(req.method, ["POST"]);
    requireSameOrigin(req);

    if (isDashboardApiMaintenanceEnabled()) {
      return res.status(503).json(getMaintenanceApiPayload(req));
    }

    rateLimitOrThrow({ req, res, key: "quest:claim", limit: 10, windowMs: 60_000 });

    const session = getSession(req);
    if (!session) return res.status(401).json({ ok: false, error: "unauthorized" });

    const isQuestAdmin = isQuestAdminWallet(session.wallet);

    const body = safeJson<Body>(req.body);
    const action = body.action;
    const questId = body.questId;
    const proof = typeof body.proof === "string" ? body.proof.trim() : "";

    if (!isString(action) || !ALLOWED_ACTIONS.has(action)) {
      return res.status(400).json({ ok: false, error: "action_not_allowed" });
    }
    if (!isString(questId)) {
      return res.status(400).json({ ok: false, error: "quest_id_required" });
    }

    const quest = getQuestById(questId);
    if (!quest) return res.status(404).json({ ok: false, error: "quest_not_found" });

    const mk = getCurrentMonthKey();

    if (hasClaimed(session.wallet, quest, mk)) {
      const snap = getClaimsSnapshot(session.wallet, mk);
      return res.status(200).json({
        ok: true,
        alreadyClaimed: true,
        month: mk,
        points: snap.points,
        claimedIds: snap.claimedIds,
      });
    }

    const connection = new Connection(RPC, "confirmed");

    if (!isQuestAdmin) {
      const v = await verifyQuest(connection, session.wallet, quest);
      if (!v.ok) return res.status(403).json({ ok: false, error: v.error });
    }

    const isReviewQuest = !isQuestAdmin && quest.reviewPolicy.reviewMode !== "none";

    if (isReviewQuest) {
      if (!proof) {
        return res.status(400).json({ ok: false, error: "proof_required" });
      }

      const submission = createSubmission(session.wallet, quest, proof, mk);

      return res.status(200).json({
        ok: true,
        month: mk,
        pendingReview: true,
        submissionId: submission.id,
        status: submission.status,
        approvalsRequired: submission.approvalsRequired,
        requiresAdminFinal: submission.adminFinalRequired,
      });
    }

    const pointsToAward = await computePointsForQuest(connection, session.wallet, quest);
    if (pointsToAward <= 0) {
      return res.status(403).json({ ok: false, error: "no_eligible_points" });
    }

    const result = claimQuest(session.wallet, quest, pointsToAward, mk);
    const snapshot = getClaimsSnapshot(session.wallet, mk);

    return res.status(200).json({
      ok: true,
      month: mk,
      alreadyClaimed: result.alreadyClaimed,
      pointsAwarded: pointsToAward,
      points: snapshot.points,
      claimedIds: snapshot.claimedIds,
    });
  } catch (e: any) {
    const status = e?.statusCode || 500;
    return res.status(status).json({ ok: false, error: e?.message || "server_error" });
  }
}
