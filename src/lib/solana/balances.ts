import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { TOKEN_PROGRAM } from "./constants";

export function ataOf(owner: PublicKey, mint: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(mint, owner, false, TOKEN_PROGRAM);
}

export async function solBalance(conn: Connection, owner: PublicKey): Promise<bigint> {
  return BigInt(await conn.getBalance(owner, "confirmed"));
}

/** Somme de tous les comptes token du wallet pour ce mint (ATA + éventuels comptes non-ATA). */
export async function splBalance(conn: Connection, owner: PublicKey, mint: PublicKey): Promise<bigint> {
  const res = await conn.getParsedTokenAccountsByOwner(owner, { mint }, "confirmed");
  let total = 0n;
  for (const a of res.value) {
    const amt = (a.account.data as { parsed?: { info?: { tokenAmount?: { amount?: string } } } }).parsed?.info?.tokenAmount?.amount;
    if (amt) total += BigInt(amt);
  }
  return total;
}
