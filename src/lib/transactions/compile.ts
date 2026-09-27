import { ComputeBudgetProgram, PublicKey, TransactionInstruction, TransactionMessage, VersionedTransaction, type Connection } from "@solana/web3.js";
import { COMPUTE } from "../solana/constants";
import { ValidationError } from "./errors";

/** Compile des instructions en VersionedTransaction v0 avec un blockhash FRAIS (pas de réutilisation). */
export async function compileFresh(
  conn: Pick<Connection, "getLatestBlockhash">,
  payer: PublicKey,
  instructions: TransactionInstruction[],
  units: number,
): Promise<{ tx: VersionedTransaction; lastValidBlockHeight: number }> {
  const filtered = instructions.filter((ix) => !ix.programId.equals(ComputeBudgetProgram.programId));
  for (const ix of filtered) {
    for (const k of ix.keys) if (k.isSigner && !k.pubkey.equals(payer)) throw new ValidationError("Une instruction exige un signataire autre que le wallet connecté");
  }
  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash("confirmed");
  const msg = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockhash,
    instructions: [
      ComputeBudgetProgram.setComputeUnitLimit({ units }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: COMPUTE.microLamports }),
      ...filtered,
    ],
  }).compileToV0Message();
  return { tx: new VersionedTransaction(msg), lastValidBlockHeight };
}

/** Frais réseau estimés (base 5000 lamports/signature + priorité). */
export function estimateNetworkFeeLamports(units: number): bigint {
  return 5000n + (BigInt(units) * BigInt(COMPUTE.microLamports)) / 1_000_000n;
}
