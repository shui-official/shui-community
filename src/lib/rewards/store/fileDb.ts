import fs from "fs";
import path from "path";
import type { RewardsCollectionKey, RewardsDataCollections } from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "rewards");

const FILES: Record<RewardsCollectionKey, string> = {
  monthlyBatches: "monthly-batches.json",
  snapshots: "snapshots.json",
  vestingSchedules: "vesting-schedules.json",
  vestingInstallments: "vesting-installments.json",
  distributionLedger: "distribution-ledger.json",
  walletValidations: "wallet-validations.json",
  budget: "budget.json",
  communityWallet: "community-wallet.json",
};

const DEFAULTS: RewardsDataCollections = {
  monthlyBatches: [],
  snapshots: [],
  vestingSchedules: [],
  vestingInstallments: [],
  distributionLedger: [],
  walletValidations: [],
  budget: null,
  communityWallet: null,
};

function getFilePath(key: RewardsCollectionKey): string {
  return path.join(DATA_DIR, FILES[key]);
}

function ensureDataDir(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function ensureFileExists(key: RewardsCollectionKey): void {
  ensureDataDir();

  const filePath = getFilePath(key);
  if (fs.existsSync(filePath)) return;

  const initialValue = DEFAULTS[key];
  fs.writeFileSync(filePath, JSON.stringify(initialValue, null, 2) + "\n", "utf8");
}

export function readRewardsFile<K extends RewardsCollectionKey>(key: K): RewardsDataCollections[K] {
  ensureFileExists(key);

  const filePath = getFilePath(key);
  const raw = fs.readFileSync(filePath, "utf8").trim();

  if (!raw) {
    return DEFAULTS[key];
  }

  return JSON.parse(raw) as RewardsDataCollections[K];
}

export function writeRewardsFile<K extends RewardsCollectionKey>(key: K, value: RewardsDataCollections[K]): void {
  ensureFileExists(key);

  const filePath = getFilePath(key);
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

export function readAllRewardsData(): RewardsDataCollections {
  return {
    monthlyBatches: readRewardsFile("monthlyBatches"),
    snapshots: readRewardsFile("snapshots"),
    vestingSchedules: readRewardsFile("vestingSchedules"),
    vestingInstallments: readRewardsFile("vestingInstallments"),
    distributionLedger: readRewardsFile("distributionLedger"),
    walletValidations: readRewardsFile("walletValidations"),
    budget: readRewardsFile("budget"),
    communityWallet: readRewardsFile("communityWallet"),
  };
}

export {};
