/**
 * Orca Whirlpool — USDC ⇄ SHUI en DIRECT (jamais via SOL).
 * Quote calculée avec les tick arrays réels du pool (IGNORE_CACHE).
 */
import { PublicKey, type Connection, type VersionedTransaction, type Transaction } from "@solana/web3.js";
import { WhirlpoolContext, buildWhirlpoolClient, swapQuoteByInputToken, IGNORE_CACHE, type Whirlpool } from "@orca-so/whirlpools-sdk";
import { Percentage } from "@orca-so/common-sdk";
import BN from "bn.js";
import { COMPUTE, ORCA_WHIRLPOOL, TOKENS } from "../solana/constants";
import { compileFresh } from "../transactions/compile";
import { ValidationError } from "../transactions/errors";
import type { SwapQuote } from "../raydium/cpmm";

function readonlyWallet(owner: PublicKey) {
  // Wallet "lecture seule" pour le SDK : il ne signe RIEN (la signature est faite plus tard par Phantom/Solflare via le pipeline).
  const refuse = async <T extends Transaction | VersionedTransaction>(): Promise<T> => { throw new Error("Signature interdite dans la couche SDK"); };
  return { publicKey: owner, signTransaction: refuse, signAllTransactions: async <T extends Transaction | VersionedTransaction>(): Promise<T[]> => { throw new Error("Signature interdite dans la couche SDK"); } };
}

async function loadPool(conn: Connection, owner: PublicKey): Promise<{ ctx: WhirlpoolContext; pool: Whirlpool }> {
  const ctx = WhirlpoolContext.from(conn, readonlyWallet(owner));
  if (!ctx.program.programId.equals(ORCA_WHIRLPOOL.programId)) throw new ValidationError("Programme Whirlpool inattendu");
  const pool = await buildWhirlpoolClient(ctx).getPool(ORCA_WHIRLPOOL.poolId, IGNORE_CACHE);
  const d = pool.getData();
  if (!d.tokenMintA.equals(ORCA_WHIRLPOOL.mintA) || !d.tokenMintB.equals(ORCA_WHIRLPOOL.mintB)) throw new ValidationError("Mints du Whirlpool inattendus");
  if (d.tickSpacing !== ORCA_WHIRLPOOL.tickSpacing || d.feeRate !== ORCA_WHIRLPOOL.feeRate) throw new ValidationError("Paramètres du Whirlpool inattendus");
  if (!d.whirlpoolsConfig.equals(ORCA_WHIRLPOOL.config)) throw new ValidationError("Config Whirlpool inattendue");
  return { ctx, pool };
}

function assertPair(input: PublicKey, output: PublicKey) {
  const ok = (input.equals(TOKENS.USDC.mint) && output.equals(TOKENS.SHUI.mint)) || (input.equals(TOKENS.SHUI.mint) && output.equals(TOKENS.USDC.mint));
  if (!ok) throw new ValidationError("Paire non supportée par le Whirlpool SHUI/USDC");
}

async function rawQuote(conn: Connection, owner: PublicKey, input: PublicKey, amountIn: bigint, slippageBps: number) {
  const { ctx, pool } = await loadPool(conn, owner);
  const q = await swapQuoteByInputToken(pool, input, new BN(amountIn.toString()), Percentage.fromFraction(slippageBps, 10_000), ORCA_WHIRLPOOL.programId, ctx.fetcher, IGNORE_CACHE);
  return { pool, q };
}

export async function quoteOrca(conn: Connection, owner: PublicKey, input: PublicKey, output: PublicKey, amountIn: bigint, slippageBps: number): Promise<SwapQuote> {
  assertPair(input, output);
  const { q } = await rawQuote(conn, owner, input, amountIn, slippageBps);
  return {
    protocol: "Orca Whirlpool", pool: ORCA_WHIRLPOOL.poolId, inputMint: input, outputMint: output,
    amountIn: BigInt(q.estimatedAmountIn.toString()), estimatedOut: BigInt(q.estimatedAmountOut.toString()),
    minOut: BigInt(q.otherAmountThreshold.toString()), poolFee: BigInt(q.estimatedFeeAmount.toString()),
    priceImpactPct: null, slippageBps,
  };
}

export async function buildOrcaSwap(conn: Connection, owner: PublicKey, input: PublicKey, output: PublicKey, amountIn: bigint, slippageBps: number) {
  assertPair(input, output);
  const { pool, q } = await rawQuote(conn, owner, input, amountIn, slippageBps);
  if (q.aToB !== input.equals(ORCA_WHIRLPOOL.mintA)) throw new ValidationError("Sens du swap Orca incohérent");
  const tb = await pool.swap(q);
  const c = tb.compressIx(true);
  if (c.signers.length) throw new ValidationError("Le SDK Orca a demandé des signataires supplémentaires : refusé");
  const { tx, lastValidBlockHeight } = await compileFresh(conn, owner, [...c.instructions, ...c.cleanupInstructions], COMPUTE.swapUnits);
  const summary: SwapQuote = {
    protocol: "Orca Whirlpool", pool: ORCA_WHIRLPOOL.poolId, inputMint: input, outputMint: output,
    amountIn: BigInt(q.estimatedAmountIn.toString()), estimatedOut: BigInt(q.estimatedAmountOut.toString()),
    minOut: BigInt(q.otherAmountThreshold.toString()), poolFee: BigInt(q.estimatedFeeAmount.toString()),
    priceImpactPct: null, slippageBps,
  };
  return { tx, lastValidBlockHeight, summary };
}
