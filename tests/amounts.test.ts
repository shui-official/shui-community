import { describe, it, expect } from "vitest";
import { parseUnits, formatUnits, applySlippage, AmountError } from "../src/lib/solana/amounts";
import { TOKENS } from "../src/lib/solana/constants";

describe("decimals / montants", () => {
  it("SHUI = 9 décimales, USDC = 6, SOL = 9, LP = 9", () => {
    expect(TOKENS.SHUI.decimals).toBe(9); expect(TOKENS.USDC.decimals).toBe(6); expect(TOKENS.SOL.decimals).toBe(9); expect(TOKENS.LP.decimals).toBe(9);
  });
  it("parse exact sans flottant", () => {
    expect(parseUnits("1", 9)).toBe(1_000_000_000n);
    expect(parseUnits("0,000000001", 9)).toBe(1n);
    expect(parseUnits("1 000 000 000", 9)).toBe(1_000_000_000_000_000_000n);
    expect(parseUnits("12.5", 6)).toBe(12_500_000n);
    expect(parseUnits("0.1", 9) + parseUnits("0.2", 9)).toBe(parseUnits("0.3", 9));
  });
  it("refuse les entrées invalides et l'excès de décimales", () => {
    expect(() => parseUnits("abc", 9)).toThrow(AmountError);
    expect(() => parseUnits("-1", 9)).toThrow(AmountError);
    expect(() => parseUnits("1.1234567", 6)).toThrow(/6 décimales/);
    expect(() => parseUnits("", 9)).toThrow(AmountError);
  });
  it("format", () => {
    expect(formatUnits(1_234_567_890_000n, 9)).toBe("1 234,56789");
    expect(formatUnits(1n, 6)).toBe("0,000001");
    expect(formatUnits(5_000_000n, 6, 2)).toBe("5");
  });
});

describe("slippage", () => {
  it("minimum reçu = floor(out * (1 - bps))", () => {
    expect(applySlippage(10_000n, 100)).toBe(9_900n);
    expect(applySlippage(999n, 50)).toBe(994n);
    expect(applySlippage(0n, 100)).toBe(0n);
  });
  it("refuse un slippage hors bornes", () => {
    expect(() => applySlippage(1n, -1)).toThrow();
    expect(() => applySlippage(1n, 10_000)).toThrow();
    expect(() => applySlippage(1n, 1.5)).toThrow();
  });
});
