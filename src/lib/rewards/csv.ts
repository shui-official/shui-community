import type { CsvExportRow, DistributionLedgerEntry, RewardPeriod } from "./types";

function escapeCsvValue(value: string | number): string {
  const stringValue = String(value);
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export function buildImmediateCsvRows(entries: DistributionLedgerEntry[], period: RewardPeriod): CsvExportRow[] {
  return entries
    .filter((entry) => entry.entryType === "immediate")
    .filter((entry) => entry.status !== "blocked")
    .filter((entry) => entry.csvIncluded)
    .filter((entry) => entry.amountPlanned > 0)
    .map((entry) => ({
      wallet: entry.wallet,
      amount: entry.amountPlanned,
      label: `SHUI immediate ${period}`,
    }));
}

export function buildVestingCsvRows(entries: DistributionLedgerEntry[], period: RewardPeriod): CsvExportRow[] {
  return entries
    .filter((entry) => entry.entryType === "vesting")
    .filter((entry) => entry.status !== "blocked")
    .filter((entry) => entry.csvIncluded)
    .filter((entry) => entry.amountPlanned > 0)
    .map((entry) => ({
      wallet: entry.wallet,
      amount: entry.amountPlanned,
      label: `SHUI vesting ${period}`,
    }));
}

export function toCsvString(rows: CsvExportRow[]): string {
  const header = ["wallet", "amount", "label"];
  const lines = rows.map((row) =>
    [row.wallet, row.amount, row.label].map(escapeCsvValue).join(",")
  );

  return [header.join(","), ...lines].join("\n") + "\n";
}

export {};
