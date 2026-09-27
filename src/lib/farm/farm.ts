/**
 * Raydium Farm v6 — SHUI/SOL (UTILISATION uniquement).
 * Ce module n'expose QUE deposit / withdraw / claim pour l'utilisateur connecté.
 * Aucune fonction de création, restart, ajout de reward ou retrait créateur n'existe ici — par design.
 */
import { PublicKey, type Connection } from "@solana/web3.js";
import { farmStateV6Layout, farmLedgerLayoutV6_1, getAssociatedLedgerAccount, makeDepositInstructionV6, makeWithdrawInstructionV6 } from "@raydium-io/raydium-sdk-v2";
import { createAssociatedTokenAccountIdempotentInstruction } from "@solana/spl-token";
import BN from "bn.js";
import { COMPUTE, RAYDIUM_FARM, TOKEN_PROGRAM } from "../solana/constants";
import { ataOf, splBalance } from "../solana/balances";
import { compileFresh } from "../transactions/compile";
import { ValidationError } from "../transactions/errors";

export interface FarmReward { mint: PublicKey; vault: PublicKey; perSecond: bigint; openTime: number; endTime: number; lastUpdate: number; accPerShare: bigint; totalReward: bigint; emissioned: bigint; state: bigint }
export interface FarmState { lpVault: PublicKey; lpMint: PublicKey; multiplier: bigint; rewards: FarmReward[]; totalStaked: bigint }
export interface UserPosition { ledger: PublicKey; exists: boolean; deposited: bigint; rewardDebts: bigint[]; walletLp: bigint; pending: bigint[] }

export function ledgerOf(owner: PublicKey): PublicKey {
  return getAssociatedLedgerAccount({ programId: RAYDIUM_FARM.programId, poolId: RAYDIUM_FARM.farmId, owner, version: 6 });
}

/** Décodage + vérification stricte de l'état Farm on-chain. */
export function decodeFarmState(owner: PublicKey, data: Buffer): Omit<FarmState, "totalStaked"> {
  if (!owner.equals(RAYDIUM_FARM.programId)) throw new ValidationError("Le compte Farm n'appartient pas au programme Farm v6");
  const s = farmStateV6Layout.decode(data);
  if (!s.lpMint.equals(RAYDIUM_FARM.lpMint)) throw new ValidationError("LP mint de la Farm inattendu");
  if (!s.lpVault.equals(RAYDIUM_FARM.lpVault)) throw new ValidationError("LP vault de la Farm inattendu");
  const n = Number(s.validRewardTokenNum.toString());
  const rewards: FarmReward[] = s.rewardInfos.slice(0, n).map((r) => ({
    mint: r.rewardMint, vault: r.rewardVault, perSecond: BigInt(r.rewardPerSecond.toString()),
    openTime: Number(r.rewardOpenTime.toString()), endTime: Number(r.rewardEndTime.toString()), lastUpdate: Number(r.rewardLastUpdateTime.toString()),
    accPerShare: BigInt(r.accRewardPerShare.toString()), totalReward: BigInt(r.totalReward.toString()), emissioned: BigInt(r.totalRewardEmissioned.toString()),
    state: BigInt(r.rewardState.toString()),
  }));
  const r0 = rewards[0];
  if (!r0 || !r0.mint.equals(RAYDIUM_FARM.rewardMint) || !r0.vault.equals(RAYDIUM_FARM.rewardVault)) throw new ValidationError("Reward de la Farm inattendue (mint ou vault)");
  return { lpVault: s.lpVault, lpMint: s.lpMint, multiplier: BigInt(s.rewardMultiplier.toString()), rewards };
}

/**
 * Rewards en attente — même formule que le programme Farm v6 / SDK Raydium :
 *   acc' = acc + min(now,end)-lastUpdate) * perSecond * multiplier / totalStaked   (borné par le reste à émettre)
 *   pending = deposited * acc' / multiplier - rewardDebt
 */
export function computePending(state: FarmState, deposited: bigint, rewardDebts: bigint[], nowSec: number): bigint[] {
  return state.rewards.map((r, i) => {
    let acc = r.accPerShare;
    if (r.state !== 0n && state.totalStaked > 0n) {
      const until = Math.min(nowSec, r.endTime);
      if (until > r.lastUpdate && r.openTime < until) {
        let emit = BigInt(until - r.lastUpdate) * r.perSecond;
        const left = r.totalReward - r.emissioned;
        if (left < emit) emit = left > 0n ? left : 0n;
        acc += (emit * state.multiplier) / state.totalStaked;
      }
    }
    const debt = rewardDebts[i] ?? 0n;
    const p = (deposited * acc) / state.multiplier - debt;
    return p > 0n ? p : 0n;
  });
}

export async function fetchFarm(conn: Connection): Promise<FarmState> {
  const [farmAcc, vault] = await Promise.all([
    conn.getAccountInfo(RAYDIUM_FARM.farmId, "confirmed"),
    conn.getTokenAccountBalance(RAYDIUM_FARM.lpVault, "confirmed"),
  ]);
  if (!farmAcc) throw new ValidationError("Compte Farm introuvable");
  const base = decodeFarmState(farmAcc.owner, farmAcc.data);
  return { ...base, totalStaked: BigInt(vault.value.amount) };
}

export async function fetchPosition(conn: Connection, owner: PublicKey, state: FarmState): Promise<UserPosition> {
  const ledger = ledgerOf(owner);
  const [acc, walletLp] = await Promise.all([conn.getAccountInfo(ledger, "confirmed"), splBalance(conn, owner, RAYDIUM_FARM.lpMint)]);
  let deposited = 0n; let rewardDebts: bigint[] = [];
  if (acc) {
    if (!acc.owner.equals(RAYDIUM_FARM.programId)) throw new ValidationError("Ledger Farm invalide");
    const l = farmLedgerLayoutV6_1.decode(acc.data);
    if (!l.id.equals(RAYDIUM_FARM.farmId) || !l.owner.equals(owner)) throw new ValidationError("Ledger Farm ne correspond pas au wallet");
    deposited = BigInt(l.deposited.toString());
    rewardDebts = l.rewardDebts.map((d: BN) => BigInt(d.toString()));
  }
  const now = Math.floor(Date.now() / 1000);
  return { ledger, exists: !!acc, deposited, rewardDebts, walletLp, pending: computePending(state, deposited, rewardDebts, now) };
}

export type FarmAction = "deposit" | "withdraw" | "claim";

/** Construit deposit / withdraw / claim (claim = withdraw de 0 LP, mécanisme natif Farm v6). */
export async function buildFarmTx(conn: Connection, owner: PublicKey, action: FarmAction, amount: bigint, position: UserPosition) {
  if (action === "claim" && amount !== 0n) throw new ValidationError("Claim : montant doit être 0");
  if (action !== "claim" && amount <= 0n) throw new ValidationError("Montant LP invalide");
  if (action === "deposit" && amount > position.walletLp) throw new ValidationError("LP insuffisants dans le wallet");
  if (action === "withdraw" && amount > position.deposited) throw new ValidationError("LP insuffisants dans la Farm");
  if (action === "claim" && position.deposited === 0n) throw new ValidationError("Aucune position dans la Farm");

  const lpAccount = ataOf(owner, RAYDIUM_FARM.lpMint);
  const rewardAccount = ataOf(owner, RAYDIUM_FARM.rewardMint);
  const pre = [
    createAssociatedTokenAccountIdempotentInstruction(owner, rewardAccount, owner, RAYDIUM_FARM.rewardMint, TOKEN_PROGRAM),
    createAssociatedTokenAccountIdempotentInstruction(owner, lpAccount, owner, RAYDIUM_FARM.lpMint, TOKEN_PROGRAM),
  ];
  const params = {
    farmInfo: { id: RAYDIUM_FARM.farmId.toBase58(), programId: RAYDIUM_FARM.programId.toBase58() },
    farmKeys: { authority: RAYDIUM_FARM.authority.toBase58(), lpVault: RAYDIUM_FARM.lpVault.toBase58(), rewardInfos: [{ vault: RAYDIUM_FARM.rewardVault.toBase58() }] },
    lpAccount, rewardAccounts: [rewardAccount], owner, amount: new BN(amount.toString()),
  } as unknown as Parameters<typeof makeDepositInstructionV6>[0];
  const ix = action === "deposit" ? makeDepositInstructionV6(params) : makeWithdrawInstructionV6(params);
  if (!ix.programId.equals(RAYDIUM_FARM.programId)) throw new ValidationError("Instruction Farm hors programme v6");
  const tag = ix.data[0];
  if ((action === "deposit" && tag !== 1) || (action !== "deposit" && tag !== 2)) throw new ValidationError("Discriminant d'instruction Farm inattendu");
  const { tx, lastValidBlockHeight } = await compileFresh(conn, owner, [...pre, ix], COMPUTE.farmUnits);
  return { tx, lastValidBlockHeight, summary: { action, amount, pending: position.pending } };
}

/** Comptes attendus pour la validation pipeline d'une opération Farm. */
export function farmRequiredAccounts(owner: PublicKey): PublicKey[] {
  return [RAYDIUM_FARM.farmId, RAYDIUM_FARM.authority, RAYDIUM_FARM.lpVault, RAYDIUM_FARM.rewardVault, ledgerOf(owner), ataOf(owner, RAYDIUM_FARM.lpMint), ataOf(owner, RAYDIUM_FARM.rewardMint)];
}
