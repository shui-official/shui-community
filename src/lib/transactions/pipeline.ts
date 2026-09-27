/**
 * PIPELINE UNIQUE — toute opération SHUI (swap, farm) passe par ici.
 *
 *   BUILD → VALIDATION → SIMULATION (err === null OBLIGATOIRE) → AFFICHAGE
 *   → SIGNATURE WALLET → vérif. blockhash → BROADCAST → CONFIRMATION → refresh
 *
 * Aucune clé privée n'est jamais manipulée : seule `signTransaction` du wallet
 * utilisateur (Phantom / Solflare) est appelée, et uniquement après simulation OK.
 */
import type { Connection, VersionedTransaction } from "@solana/web3.js";
import { assertMainnet } from "../solana/connection";
import { validateTransaction, type Expectations } from "./validate";
import { BlockhashExpiredError, ConfirmationError, SimulationError, ValidationError, WalletError } from "./errors";

export type Conn = Pick<Connection, "getGenesisHash" | "simulateTransaction" | "getBlockHeight" | "sendRawTransaction" | "confirmTransaction" | "getLatestBlockhash">;

export interface Prepared<S = unknown> {
  tx: VersionedTransaction;
  summary: S;
  expectations: Expectations;
  lastValidBlockHeight: number;
  simulation: { unitsConsumed?: number; logs: string[] };
}

export interface DiagnosticSink { (entry: { stage: string; err?: unknown; logs?: string[]; unitsConsumed?: number }): void }
let diag: DiagnosticSink | null = null;
/** Mode diagnostic : conserve err / logs / unitsConsumed (jamais de secret : on ne logge que des données publiques). */
export function setDiagnostics(sink: DiagnosticSink | null) { diag = sink; }

export async function prepare<S>(
  conn: Conn,
  build: () => Promise<{ tx: VersionedTransaction; summary: S; lastValidBlockHeight: number }>,
  expectations: Expectations,
): Promise<Prepared<S>> {
  await assertMainnet(conn);
  const { tx, summary, lastValidBlockHeight } = await build();
  validateTransaction(tx, expectations);
  const sim = await conn.simulateTransaction(tx, { sigVerify: false, replaceRecentBlockhash: false, commitment: "confirmed" });
  const logs = sim.value.logs ?? [];
  diag?.({ stage: "simulation", err: sim.value.err, logs, unitsConsumed: sim.value.unitsConsumed });
  if (sim.value.err !== null) throw new SimulationError(sim.value.err, logs, sim.value.unitsConsumed);
  return { tx, summary, expectations, lastValidBlockHeight, simulation: { unitsConsumed: sim.value.unitsConsumed, logs } };
}

export type SignFn = (tx: VersionedTransaction) => Promise<VersionedTransaction>;

export async function execute(conn: Conn, prepared: Prepared, sign: SignFn | undefined): Promise<string> {
  if (!sign) throw new WalletError("Wallet non connecté");
  // 1. blockhash encore valide ?
  const height = await conn.getBlockHeight("confirmed");
  if (height > prepared.lastValidBlockHeight) throw new BlockhashExpiredError();
  const before = Buffer.from(prepared.tx.message.serialize()).toString("base64");
  // 2. signature par le wallet utilisateur
  let signed: VersionedTransaction;
  try { signed = await sign(prepared.tx); } catch (e) { throw new WalletError("Signature refusée ou annulée dans le wallet" + ((e as Error)?.message ? ` (${(e as Error).message})` : "")); }
  // 3. si le wallet a modifié le message, on re-valide intégralement
  const after = Buffer.from(signed.message.serialize()).toString("base64");
  if (after !== before) {
    try { validateTransaction(signed, prepared.expectations); } catch (e) { throw new ValidationError("Le wallet a modifié la transaction de façon non conforme : envoi annulé. " + (e as Error).message); }
  }
  if (!signed.signatures[0] || signed.signatures[0].every((b) => b === 0)) throw new WalletError("Transaction non signée");
  const height2 = await conn.getBlockHeight("confirmed");
  if (height2 > prepared.lastValidBlockHeight) throw new BlockhashExpiredError();
  // 4. broadcast immédiat (preflight activé)
  const sig = await conn.sendRawTransaction(signed.serialize(), { skipPreflight: false, preflightCommitment: "confirmed", maxRetries: 3 });
  // 5. confirmation
  const blockhash = signed.message.recentBlockhash;
  const res = await conn.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight: prepared.lastValidBlockHeight }, "confirmed");
  if (res.value.err) { diag?.({ stage: "confirmation", err: res.value.err }); throw new ConfirmationError("Transaction incluse mais échouée on-chain", sig); }
  return sig;
}
