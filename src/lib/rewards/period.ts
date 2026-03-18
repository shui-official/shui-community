import type { RewardPeriod } from "./types";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function toRewardPeriod(input: Date | number | string): RewardPeriod {
  const d = input instanceof Date ? input : new Date(input);
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  return `${y}-${m}`;
}

export function parseRewardPeriod(period: RewardPeriod): { year: number; month: number } {
  const [yearStr, monthStr] = period.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error(`invalid_reward_period:${period}`);
  }

  return { year, month };
}

export function getCurrentRewardPeriod(now = Date.now()): RewardPeriod {
  return toRewardPeriod(now);
}

export function getPreviousRewardPeriod(period: RewardPeriod): RewardPeriod {
  const { year, month } = parseRewardPeriod(period);

  if (month === 1) {
    return `${year - 1}-12`;
  }

  return `${year}-${pad2(month - 1)}`;
}

export function getNextRewardPeriod(period: RewardPeriod): RewardPeriod {
  const { year, month } = parseRewardPeriod(period);

  if (month === 12) {
    return `${year + 1}-01`;
  }

  return `${year}-${pad2(month + 1)}`;
}

export function addMonthsToRewardPeriod(period: RewardPeriod, monthsToAdd: number): RewardPeriod {
  const { year, month } = parseRewardPeriod(period);

  const zeroBasedMonth = month - 1;
  const totalMonths = year * 12 + zeroBasedMonth + monthsToAdd;

  const nextYear = Math.floor(totalMonths / 12);
  const nextMonth = (totalMonths % 12) + 1;

  return `${nextYear}-${pad2(nextMonth)}`;
}

export function getRewardPeriodStartDate(period: RewardPeriod): Date {
  const { year, month } = parseRewardPeriod(period);
  return new Date(year, month - 1, 1, 0, 0, 0, 0);
}

export function getRewardPeriodEndDate(period: RewardPeriod): Date {
  const { year, month } = parseRewardPeriod(period);
  return new Date(year, month, 0, 23, 59, 59, 999);
}

export function getSnapshotExecutionPeriod(now = Date.now()): {
  payablePeriod: RewardPeriod;
  sourcePeriod: RewardPeriod;
} {
  const payablePeriod = getCurrentRewardPeriod(now);
  const sourcePeriod = getPreviousRewardPeriod(payablePeriod);

  return {
    payablePeriod,
    sourcePeriod,
  };
}

export function isSameRewardPeriod(a: RewardPeriod, b: RewardPeriod): boolean {
  return a === b;
}

export {};
