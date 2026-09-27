import type { PublicKey } from "@solana/web3.js";
import { ORCA_WHIRLPOOL, RAYDIUM_CPMM, RAYDIUM_FARM, TOKENS, type OperationKind } from "../solana/constants";
import { farmRequiredAccounts } from "../farm/farm";
import type { Expectations } from "./validate";

/** Attentes de sécurité pour un swap : programme, pool et mints exacts. */
export function swapExpectations(kind: OperationKind, owner: PublicKey): Expectations {
  if (kind === "raydiumSwap") {
    return { kind, owner, coreProgram: RAYDIUM_CPMM.programId, requiredAccounts: [RAYDIUM_CPMM.poolId, RAYDIUM_CPMM.ammConfig, RAYDIUM_CPMM.vault0, RAYDIUM_CPMM.vault1, TOKENS.SHUI.mint, TOKENS.SOL.mint], forbiddenAccounts: [TOKENS.USDC.mint, ORCA_WHIRLPOOL.poolId, RAYDIUM_FARM.farmId] };
  }
  if (kind === "orcaSwap") {
    return { kind, owner, coreProgram: ORCA_WHIRLPOOL.programId, requiredAccounts: [ORCA_WHIRLPOOL.poolId, ORCA_WHIRLPOOL.vaultA, ORCA_WHIRLPOOL.vaultB], forbiddenAccounts: [RAYDIUM_CPMM.poolId, RAYDIUM_FARM.farmId] };
  }
  throw new Error("Type de swap inconnu");
}

export function farmExpectations(owner: PublicKey): Expectations {
  return { kind: "farm", owner, coreProgram: RAYDIUM_FARM.programId, requiredAccounts: farmRequiredAccounts(owner), forbiddenAccounts: [RAYDIUM_CPMM.poolId, ORCA_WHIRLPOOL.poolId] };
}
