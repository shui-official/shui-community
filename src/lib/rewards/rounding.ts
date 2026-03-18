import { REWARDS_IMMEDIATE_RATIO, REWARDS_VESTING_MONTHS, REWARDS_VESTING_RATIO, SHUI_DECIMALS } from "./constants";

const DECIMAL_FACTOR = 10 ** SHUI_DECIMALS;

export function roundShuiAmount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * DECIMAL_FACTOR) / DECIMAL_FACTOR;
}

export function floorShuiAmount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.floor(value * DECIMAL_FACTOR) / DECIMAL_FACTOR;
}

export function ceilShuiAmount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.ceil(value * DECIMAL_FACTOR) / DECIMAL_FACTOR;
}

export function splitImmediateAndVesting(totalShui: number): {
  totalShui: number;
  immediateShui: number;
  vestingShui: number;
} {
  const total = roundShuiAmount(totalShui);
  const immediateShui = roundShuiAmount(total * REWARDS_IMMEDIATE_RATIO);
  const vestingShui = roundShuiAmount(total * REWARDS_VESTING_RATIO);

  const delta = roundShuiAmount(total - (immediateShui + vestingShui));

  if (delta === 0) {
    return {
      totalShui: total,
      immediateShui,
      vestingShui,
    };
  }

  return {
    totalShui: total,
    immediateShui,
    vestingShui: roundShuiAmount(vestingShui + delta),
  };
}

export function buildVestingInstallments(totalVestingShui: number, months = REWARDS_VESTING_MONTHS): {
  totalVestingShui: number;
  months: number;
  baseMonthlyShui: number;
  finalMonthAdjustment: number;
  installments: number[];
} {
  const total = roundShuiAmount(totalVestingShui);

  if (!Number.isInteger(months) || months <= 0) {
    throw new Error("invalid_vesting_months");
  }

  const baseMonthlyShui = floorShuiAmount(total / months);
  const installments = Array.from({ length: months }, () => baseMonthlyShui);

  const allocatedBeforeFinal = roundShuiAmount(baseMonthlyShui * (months - 1));
  const finalInstallment = roundShuiAmount(total - allocatedBeforeFinal - baseMonthlyShui);
  installments[months - 1] = roundShuiAmount(baseMonthlyShui + finalInstallment);

  const allocatedTotal = roundShuiAmount(installments.reduce((sum, value) => sum + value, 0));
  const finalMonthAdjustment = roundShuiAmount(installments[months - 1] - baseMonthlyShui);

  if (allocatedTotal !== total) {
    const correction = roundShuiAmount(total - allocatedTotal);
    installments[months - 1] = roundShuiAmount(installments[months - 1] + correction);
  }

  return {
    totalVestingShui: total,
    months,
    baseMonthlyShui,
    finalMonthAdjustment,
    installments,
  };
}

export {};
