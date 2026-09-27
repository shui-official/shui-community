import { describe, it, expect } from "vitest";
import { routeFor, ORCA_WHIRLPOOL, RAYDIUM_CPMM, RAYDIUM_FARM, SLIPPAGE, TOKENS } from "../src/lib/solana/constants";

describe("routage (parité Web/Mobile)", () => {
  it("SOL ⇄ SHUI → Raydium CPMM", () => {
    expect(routeFor("SOL", "SHUI")?.protocol).toBe("Raydium CPMM");
    expect(routeFor("SHUI", "SOL")?.pool.equals(RAYDIUM_CPMM.poolId)).toBe(true);
  });
  it("USDC ⇄ SHUI → Orca DIRECT (jamais via SOL)", () => {
    const r = routeFor("USDC", "SHUI");
    expect(r?.protocol).toBe("Orca Whirlpool");
    expect(r?.pool.equals(ORCA_WHIRLPOOL.poolId)).toBe(true);
    expect(routeFor("SHUI", "USDC")?.kind).toBe("orcaSwap");
  });
  it("paires non supportées", () => {
    expect(routeFor("SOL", "USDC")).toBeNull();
    expect(routeFor("SHUI", "SHUI")).toBeNull();
  });
  it("adresses vérifiées figées", () => {
    expect(TOKENS.SHUI.mint.toBase58()).toBe("CnrMgNn1N3uY6GqD6FeZRdd1uhPViEFxSioWhRZsCz4C");
    expect(RAYDIUM_CPMM.poolId.toBase58()).toBe("52w19QzFSHPYTqJWk4akyhVsoeyg4A6iVn2bRsGAAXEC");
    expect(RAYDIUM_CPMM.programId.toBase58()).toBe("CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C");
    expect(RAYDIUM_CPMM.lpMint.toBase58()).toBe("FwTPGe7q8teWCppWCXT1pQixQtDsaMrCNTrYBPPWfrrn");
    expect(ORCA_WHIRLPOOL.poolId.toBase58()).toBe("9kwFpi5in5PWaX8x6zXgwBCvKq8s4N4hBgpTHFZmaNzo");
    expect(ORCA_WHIRLPOOL.programId.toBase58()).toBe("whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc");
    expect(ORCA_WHIRLPOOL.tickSpacing).toBe(64); expect(ORCA_WHIRLPOOL.feeRate).toBe(3000);
    expect(RAYDIUM_FARM.programId.toBase58()).toBe("FarmqiPv5eAj3j1GMdMCMUGXqPUvmquZtMy86QH6rzhG");
    expect(RAYDIUM_FARM.farmId.toBase58()).toBe("D2EvBpd92yGxTpT39PxV8S5NLisGfJmzEfTUwRkzVpXu");
  });
  it("slippage par défaut et bornes", () => {
    expect(SLIPPAGE.defaultBps).toBe(100); expect(SLIPPAGE.maxBps).toBe(500);
  });
});
