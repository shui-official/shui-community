/**
 * SHUI — Règles métier on-chain partagées (Web ⇄ Mobile).
 * Toutes les adresses ci-dessous ont été VÉRIFIÉES on-chain (Solana Mainnet)
 * le 2026-09-26 — voir SHUI_WEB3_PARITY.md §Vérifications.
 * Ne JAMAIS modifier une adresse sans nouvelle vérification on-chain.
 */
import { PublicKey } from "@solana/web3.js";

export const MAINNET_GENESIS_HASH = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d";
export const DEFAULT_RPC = "https://api.mainnet-beta.solana.com";

export const TOKEN_PROGRAM = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
export const ATA_PROGRAM = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
export const SYSTEM_PROGRAM = new PublicKey("11111111111111111111111111111111");
export const COMPUTE_BUDGET_PROGRAM = new PublicKey("ComputeBudget111111111111111111111111111111");

export const TOKENS = {
  SOL: { symbol: "SOL", mint: new PublicKey("So11111111111111111111111111111111111111112"), decimals: 9 },
  SHUI: { symbol: "SHUI", mint: new PublicKey("CnrMgNn1N3uY6GqD6FeZRdd1uhPViEFxSioWhRZsCz4C"), decimals: 9 },
  USDC: { symbol: "USDC", mint: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"), decimals: 6 },
  LP: { symbol: "LP SHUI/SOL", mint: new PublicKey("FwTPGe7q8teWCppWCXT1pQixQtDsaMrCNTrYBPPWfrrn"), decimals: 9 },
} as const;
export type TokenSymbol = "SOL" | "SHUI" | "USDC";

/** Raydium CPMM SOL/SHUI (mint0 = WSOL, mint1 = SHUI, tradeFeeRate 2500 = 0,25 %) */
export const RAYDIUM_CPMM = {
  programId: new PublicKey("CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C"),
  poolId: new PublicKey("52w19QzFSHPYTqJWk4akyhVsoeyg4A6iVn2bRsGAAXEC"),
  ammConfig: new PublicKey("D4FPEruKEHrG5TenZ2mpDGEfu1iUvTiqBxvpU8HLBvC2"),
  vault0: new PublicKey("cgrjxMrfvJnXdWqDcERZiRgSQdVnbP5XiEj7cAcFDx2"),
  vault1: new PublicKey("2wsWo4zHUB7mN5TY8rLw3bXKUWSwfzp4Fa3RYCHzNkfH"),
  lpMint: TOKENS.LP.mint,
  mint0: TOKENS.SOL.mint,
  mint1: TOKENS.SHUI.mint,
  feeLabel: "0,25 %",
} as const;

/** Orca Whirlpool SHUI/USDC (tokenA = SHUI, tokenB = USDC, tickSpacing 64, feeRate 3000 = 0,30 %) */
export const ORCA_WHIRLPOOL = {
  programId: new PublicKey("whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc"),
  poolId: new PublicKey("9kwFpi5in5PWaX8x6zXgwBCvKq8s4N4hBgpTHFZmaNzo"),
  config: new PublicKey("2LecshUwdy9xi7meFgHtFJQNSKk4KdTrcpvaB56dP2NQ"),
  vaultA: new PublicKey("AZ6EE39acRnvSun6e7qKATqGH39moJj3bBXqk7rniVRj"),
  vaultB: new PublicKey("HpRzgqz5Wo51rfa7SAi9oA5eYT5MGhRnJdpeE7LSntuC"),
  mintA: TOKENS.SHUI.mint,
  mintB: TOKENS.USDC.mint,
  tickSpacing: 64,
  feeRate: 3000,
  feeLabel: "0,30 %",
} as const;

/** Raydium Farm v6 SHUI/SOL — Farm ID complet vérifié on-chain (owner = Farm v6, lpMint = LP SHUI/SOL). */
export const RAYDIUM_FARM = {
  programId: new PublicKey("FarmqiPv5eAj3j1GMdMCMUGXqPUvmquZtMy86QH6rzhG"),
  farmId: new PublicKey("D2EvBpd92yGxTpT39PxV8S5NLisGfJmzEfTUwRkzVpXu"),
  authority: new PublicKey("F8XMK7YPnDFkpgkp97rEpwN9Fe1WNNbxzFSKb6erBSZj"),
  lpVault: new PublicKey("8vsVUCyQZeMAfx7MY1G3715Uy3ive5RRMEY9kVmH9gfa"),
  lpMint: TOKENS.LP.mint,
  rewardMint: TOKENS.SHUI.mint,
  rewardVault: new PublicKey("FpnvUKyC6CZQtqcthSMpSUTi6eTz5FjrxsmpWWoDCND3"),
  version: 6,
} as const;

/** Slippage : mêmes bornes Web/Mobile. Valeurs en points de base. */
export const SLIPPAGE = { defaultBps: 100, options: [50, 100, 200], minBps: 10, maxBps: 500 } as const;

/** Réserve SOL minimale conservée pour frais + rent ATA. */
export const SOL_FEE_RESERVE_LAMPORTS = 10_000_000n; // 0,01 SOL

/** Compute budget partagé. */
export const COMPUTE = { swapUnits: 200_000, farmUnits: 300_000, microLamports: 25_000 } as const;

/** Programmes autorisés par opération (liste blanche stricte). */
export const ALLOWED_PROGRAMS = {
  raydiumSwap: [COMPUTE_BUDGET_PROGRAM, SYSTEM_PROGRAM, TOKEN_PROGRAM, ATA_PROGRAM, RAYDIUM_CPMM.programId],
  orcaSwap: [COMPUTE_BUDGET_PROGRAM, SYSTEM_PROGRAM, TOKEN_PROGRAM, ATA_PROGRAM, ORCA_WHIRLPOOL.programId],
  farm: [COMPUTE_BUDGET_PROGRAM, SYSTEM_PROGRAM, TOKEN_PROGRAM, ATA_PROGRAM, RAYDIUM_FARM.programId],
} as const;
export type OperationKind = keyof typeof ALLOWED_PROGRAMS;

export type Route = { protocol: "Raydium CPMM" | "Orca Whirlpool"; pool: PublicKey; kind: OperationKind; fee: string };
/** Routage déterministe — USDC ⇄ SHUI reste DIRECT via Orca (jamais via SOL). */
export function routeFor(from: TokenSymbol, to: TokenSymbol): Route | null {
  const pair = `${from}>${to}`;
  if (pair === "SOL>SHUI" || pair === "SHUI>SOL") return { protocol: "Raydium CPMM", pool: RAYDIUM_CPMM.poolId, kind: "raydiumSwap", fee: RAYDIUM_CPMM.feeLabel };
  if (pair === "USDC>SHUI" || pair === "SHUI>USDC") return { protocol: "Orca Whirlpool", pool: ORCA_WHIRLPOOL.poolId, kind: "orcaSwap", fee: ORCA_WHIRLPOOL.feeLabel };
  return null;
}
