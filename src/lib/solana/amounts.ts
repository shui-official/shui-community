/** Conversions montants ⇄ unités brutes, en bigint (aucune perte de précision flottante). */
export class AmountError extends Error {}

export function parseUnits(input: string, decimals: number): bigint {
  const s = input.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d*\.?\d*$/.test(s) || s === "" || s === ".") throw new AmountError("Montant invalide");
  const [int = "0", frac = ""] = s.split(".");
  if (frac.length > decimals) throw new AmountError(`Maximum ${decimals} décimales`);
  const raw = BigInt((int || "0") + frac.padEnd(decimals, "0"));
  return raw;
}

export function formatUnits(raw: bigint, decimals: number, maxFrac = decimals): string {
  const neg = raw < 0n; const v = neg ? -raw : raw;
  const base = 10n ** BigInt(decimals);
  const int = v / base; const frac = (v % base).toString().padStart(decimals, "0").slice(0, maxFrac).replace(/0+$/, "");
  const intStr = int.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return (neg ? "-" : "") + intStr + (frac ? "," + frac : "");
}

/** Minimum reçu = floor(out * (10000 - bps) / 10000) */
export function applySlippage(out: bigint, bps: number): bigint {
  if (!Number.isInteger(bps) || bps < 0 || bps >= 10_000) throw new AmountError("Slippage invalide");
  return (out * BigInt(10_000 - bps)) / 10_000n;
}
