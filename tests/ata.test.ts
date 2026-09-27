import { describe, it, expect } from "vitest";
import { Keypair } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { ataOf } from "../src/lib/solana/balances";
import { TOKENS, TOKEN_PROGRAM } from "../src/lib/solana/constants";

describe("ATA", () => {
  it("SHUI / USDC / LP utilisent le Token Program classique (pas Token-2022)", () => {
    const o = Keypair.generate().publicKey;
    for (const t of [TOKENS.SHUI, TOKENS.USDC, TOKENS.LP]) expect(ataOf(o, t.mint).equals(getAssociatedTokenAddressSync(t.mint, o, false, TOKEN_PROGRAM))).toBe(true);
  });
  it("ATA déterministe et propre à chaque wallet", () => {
    const a = Keypair.generate().publicKey, b = Keypair.generate().publicKey;
    expect(ataOf(a, TOKENS.SHUI.mint).equals(ataOf(a, TOKENS.SHUI.mint))).toBe(true);
    expect(ataOf(a, TOKENS.SHUI.mint).equals(ataOf(b, TOKENS.SHUI.mint))).toBe(false);
  });
});
