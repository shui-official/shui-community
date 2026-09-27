import { PublicKey, VersionedTransaction, MessageV0 } from "@solana/web3.js";
import { ALLOWED_PROGRAMS, type OperationKind, TOKENS } from "../solana/constants";
import { ValidationError } from "./errors";

export interface Expectations {
  kind: OperationKind;
  owner: PublicKey;
  /** Programme métier qui DOIT être invoqué (CPMM, Whirlpool, Farm v6). */
  coreProgram: PublicKey;
  /** Comptes qui DOIVENT figurer dans la transaction (pool, farm, mints…). */
  requiredAccounts: PublicKey[];
  /** Mints interdits (garde-fou "mauvaise mint"). */
  forbiddenAccounts?: PublicKey[];
}

function accountKeys(tx: VersionedTransaction): PublicKey[] {
  const msg = tx.message;
  if ((msg as MessageV0).addressTableLookups?.length) throw new ValidationError("Tables d'adresses non autorisées pour les opérations SHUI");
  return msg.staticAccountKeys;
}

/** Contrôle statique AVANT simulation et AVANT signature. Lève ValidationError au moindre écart. */
export function validateTransaction(tx: VersionedTransaction, exp: Expectations): void {
  const keys = accountKeys(tx);
  const payer = keys[0];
  if (!payer || !payer.equals(exp.owner)) throw new ValidationError("Le payeur des frais n'est pas le wallet connecté");
  const allowed = ALLOWED_PROGRAMS[exp.kind].map((p) => p.toBase58());
  let core = false;
  for (const ix of tx.message.compiledInstructions) {
    const prog = keys[ix.programIdIndex];
    if (!prog) throw new ValidationError("Instruction invalide");
    const p = prog.toBase58();
    if (!allowed.includes(p)) throw new ValidationError(`Programme non autorisé : ${p}`);
    if (prog.equals(exp.coreProgram)) core = true;
  }
  if (!core) throw new ValidationError("Programme attendu absent de la transaction");
  const set = new Set(keys.map((k) => k.toBase58()));
  for (const r of exp.requiredAccounts) if (!set.has(r.toBase58())) throw new ValidationError(`Compte attendu absent : ${r.toBase58()}`);
  for (const f of exp.forbiddenAccounts ?? []) if (set.has(f.toBase58())) throw new ValidationError(`Compte inattendu : ${f.toBase58()}`);
  // Les signataires requis doivent être UNIQUEMENT le wallet utilisateur (aucune clé externe).
  const nSigners = tx.message.header.numRequiredSignatures;
  if (nSigners !== 1) throw new ValidationError("La transaction exige des signataires inattendus");
}

/** Mints connus : utilisé pour refuser toute mint SHUI contrefaite en entrée UI. */
export function assertKnownMint(mint: PublicKey): void {
  const ok = Object.values(TOKENS).some((t) => t.mint.equals(mint));
  if (!ok) throw new ValidationError(`Mint non reconnue : ${mint.toBase58()}`);
}
