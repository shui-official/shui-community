/**
 * Raydium CPMM — SOL ⇄ SHUI.
 * Quote calculée depuis l'état RPC réel du pool (réserves + config de frais), jamais depuis une API de prix.
 */
import { PublicKey, type Connection } from "@solana/web3.js";
import { Raydium, TxVersion } from "@raydium-io/raydium-sdk-v2";
import BN from "bn.js";
import { COMPUTE, RAYDIUM_CPMM, TOKENS } from "../solana/constants";
import { compileFresh } from "../transactions/compile";
import { ValidationError } from "../transactions/errors";

export interface SwapQuote {
  protocol: "Raydium CPMM" | "Orca Whirlpool";
  pool: PublicKey;
  inputMint: PublicKey; outputMint: PublicKey;
  amountIn: bigint; estimatedOut: bigint; minOut: bigint;
  /** Frais de pool, en unités du token d'entrée. */
  poolFee: bigint;
  priceImpactPct: number | null;
  slippageBps: number;
}

const cache = new Map<string, Raydium>();
async function sdk(conn: Connection, owner: PublicKey): Promise<Raydium> {
  const k = owner.toBase58();
  let r = cache.get(k);
  if (!r) {
    r = await Raydium.load({ connection: conn, owner, disableLoadToken: true, disableFeatureCheck: true, blockhashCommitment: "confirmed" });
    cache.set(k, r);
  }
  return r;
}

function assertPair(input: PublicKey, output: PublicKey) {
  const ok = (input.equals(TOKENS.SOL.mint) && output.equals(TOKENS.SHUI.mint)) || (input.equals(TOKENS.SHUI.mint) && output.equals(TOKENS.SOL.mint));
  if (!ok) throw new ValidationError("Paire non supportée par le pool Raydium SOL/SHUI");
}

async function loadPool(r: Raydium) {
  const data = await r.cpmm.getPoolInfoFromRpc(RAYDIUM_CPMM.poolId.toBase58());
  // Garde-fous : le pool chargé doit correspondre EXACTEMENT au pool vérifié.
  if (data.poolInfo.programId !== RAYDIUM_CPMM.programId.toBase58()) throw new ValidationError("Programme CPMM inattendu");
  if (data.poolInfo.mintA.address !== RAYDIUM_CPMM.mint0.toBase58() || data.poolInfo.mintB.address !== RAYDIUM_CPMM.mint1.toBase58()) throw new ValidationError("Mints du pool Raydium inattendus");
  if (data.poolInfo.lpMint.address !== RAYDIUM_CPMM.lpMint.toBase58()) throw new ValidationError("LP mint inattendu");
  if (data.poolInfo.config.id !== RAYDIUM_CPMM.ammConfig.toBase58()) throw new ValidationError("Config AMM inattendue");
  return data;
}

export async function quoteRaydium(conn: Connection, owner: PublicKey, input: PublicKey, output: PublicKey, amountIn: bigint, slippageBps: number): Promise<SwapQuote> {
  assertPair(input, output);
  const r = await sdk(conn, owner);
  const { computePoolInfo } = await loadPool(r);
  const q = r.cpmm.computeSwapAmount({ pool: computePoolInfo, amountIn: new BN(amountIn.toString()), outputMint: output, slippage: slippageBps / 10_000 });
  return {
    protocol: "Raydium CPMM", pool: RAYDIUM_CPMM.poolId, inputMint: input, outputMint: output,
    amountIn, estimatedOut: BigInt(q.amountOut.toString()), minOut: BigInt(q.minAmountOut.toString()),
    poolFee: BigInt(q.fee.toString()), priceImpactPct: Number(q.priceImpact.toString()) * 100, slippageBps,
  };
}

/** Construit la transaction de swap à partir d'une quote fraîche (re-calculée ici pour éviter une quote périmée). */
export async function buildRaydiumSwap(conn: Connection, owner: PublicKey, input: PublicKey, output: PublicKey, amountIn: bigint, slippageBps: number) {
  const quote = await quoteRaydium(conn, owner, input, output, amountIn, slippageBps);
  const r = await sdk(conn, owner);
  const { poolInfo, poolKeys } = await loadPool(r);
  await r.account.fetchWalletTokenAccounts({ forceUpdate: true });
  const res = await r.cpmm.swap({
    poolInfo, poolKeys,
    inputAmount: new BN(amountIn.toString()),
    baseIn: input.equals(TOKENS.SOL.mint),
    slippage: slippageBps / 10_000,
    swapResult: { inputAmount: new BN(amountIn.toString()), outputAmount: new BN(quote.estimatedOut.toString()) },
    txVersion: TxVersion.LEGACY,
  });
  const ixs = res.builder.allInstructions;
  const extraSigners = (res as unknown as { signers?: unknown[] }).signers ?? [];
  if (extraSigners.length) throw new ValidationError("Le SDK Raydium a demandé des signataires supplémentaires : refusé");
  const { tx, lastValidBlockHeight } = await compileFresh(conn, owner, ixs, COMPUTE.swapUnits);
  return { tx, lastValidBlockHeight, summary: quote };
}
