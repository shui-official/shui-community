/**
 * DIAGNOSTIC LECTURE SEULE — exécute les VRAIS constructeurs de la dApp contre Solana Mainnet,
 * puis passe par la validation du pipeline + simulateTransaction(sigVerify:false).
 * AUCUNE signature, AUCUN broadcast : ce script n'a accès à aucune clé et n'appelle jamais sendRawTransaction.
 * Usage : npx tsx scripts/simulate-mainnet.ts <ADRESSE_PUBLIQUE_TEST>
 */
import { Connection, PublicKey } from "@solana/web3.js";
import { TOKENS, DEFAULT_RPC } from "../src/lib/solana/constants";
import { buildRaydiumSwap } from "../src/lib/raydium/cpmm";
import { buildOrcaSwap } from "../src/lib/orca/whirlpool";
import { fetchFarm, fetchPosition, buildFarmTx } from "../src/lib/farm/farm";
import { validateTransaction } from "../src/lib/transactions/validate";
import { swapExpectations, farmExpectations } from "../src/lib/transactions/expectations";
import { assertMainnet } from "../src/lib/solana/connection";

const conn = new Connection(process.env.RPC || DEFAULT_RPC, "confirmed");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function sim(label: string, tx: import("@solana/web3.js").VersionedTransaction, exp: Parameters<typeof validateTransaction>[1], extra = "") {
  validateTransaction(tx, exp);
  const s = await conn.simulateTransaction(tx, { sigVerify: false, replaceRecentBlockhash: true });
  const errLog = (s.value.logs ?? []).find((l) => /error|insufficient/i.test(l)) ?? "";
  console.log(`${label.padEnd(28)} validation=OK  sim.err=${JSON.stringify(s.value.err)}  CU=${s.value.unitsConsumed} ${extra} ${s.value.err ? "| " + errLog : ""}`);
  await sleep(1500);
}
const pk = (s: string) => new PublicKey(s);
const main = async () => {
  await assertMainnet(conn); console.log("Réseau : Solana Mainnet ✓ (genesis vérifié)\n");
  const A = pk(process.argv[2] ?? "HzE9puz2RbCazSoipebJXsV5Sb6vAyy7bQDZApVfNsVb"); // SOL + LP
  const B = pk(process.argv[3] ?? "6GA59g4RZyiZ3b4uxB7PnwgmENP1AhoXWP9iq147bDXw"); // SHUI (adresse publique, utilisée en LECTURE uniquement)
  let r = await buildRaydiumSwap(conn, A, TOKENS.SOL.mint, TOKENS.SHUI.mint, 10_000_000n, 100);
  await sim("SOL → SHUI (Raydium)", r.tx, swapExpectations("raydiumSwap", A), `out≈${r.summary.estimatedOut} min=${r.summary.minOut}`);
  r = await buildRaydiumSwap(conn, B, TOKENS.SHUI.mint, TOKENS.SOL.mint, 1_000_000_000_000n, 100);
  await sim("SHUI → SOL (Raydium)", r.tx, swapExpectations("raydiumSwap", B), `out≈${r.summary.estimatedOut} min=${r.summary.minOut}`);
  let o = await buildOrcaSwap(conn, B, TOKENS.SHUI.mint, TOKENS.USDC.mint, 1_000_000_000_000n, 100);
  await sim("SHUI → USDC (Orca direct)", o.tx, swapExpectations("orcaSwap", B), `out≈${o.summary.estimatedOut} min=${o.summary.minOut}`);
  o = await buildOrcaSwap(conn, A, TOKENS.USDC.mint, TOKENS.SHUI.mint, 1_000_000n, 100);
  await sim("USDC → SHUI (Orca direct)", o.tx, swapExpectations("orcaSwap", A), `out≈${o.summary.estimatedOut} (wallet test sans USDC → échec attendu)`);
  const farm = await fetchFarm(conn); await sleep(1200);
  const pos = await fetchPosition(conn, A, farm); await sleep(1200);
  console.log(`\nFarm on-chain : totalStaked=${farm.totalStaked} reward=${farm.rewards[0]?.mint.toBase58()} perSecond=${farm.rewards[0]?.perSecond} | wallet test : LP wallet=${pos.walletLp} LP farm=${pos.deposited}`);
  const d = await buildFarmTx(conn, A, "deposit", 1_000_000_000n, pos);
  await sim("Farm deposit 1 LP", d.tx, farmExpectations(A));
  const staked = { ...pos, deposited: 1_000_000_000n };
  const w = await buildFarmTx(conn, A, "withdraw", 1_000_000_000n, staked);
  await sim("Farm withdraw (sans dépôt)", w.tx, farmExpectations(A), "(aucun LP en farm → échec attendu)");
  const c = await buildFarmTx(conn, A, "claim", 0n, staked);
  await sim("Farm claim (sans dépôt)", c.tx, farmExpectations(A), "(ledger inexistant → échec attendu)");
  console.log("\nAucune transaction signée ni envoyée.");
};
main().catch((e) => { console.error("ERREUR", e?.message ?? e); process.exit(1); });
