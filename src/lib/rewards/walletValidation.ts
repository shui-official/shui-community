import type { WalletValidationRecord, WalletValidationStatus } from "./types";

function normalizeWallet(wallet: string | null | undefined): string {
  return String(wallet || "").trim();
}

function isLikelyBase58(value: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(value);
}

export function isValidSolanaWalletAddress(wallet: string | null | undefined): boolean {
  const normalized = normalizeWallet(wallet);

  if (!normalized) return false;
  if (normalized.length < 32 || normalized.length > 44) return false;
  if (!isLikelyBase58(normalized)) return false;

  return true;
}

export function getWalletValidationStatus(wallet: string | null | undefined): {
  walletRaw: string;
  walletNormalized: string;
  status: WalletValidationStatus;
  isValid: boolean;
  reason: string | null;
  canBeIncludedInCsv: boolean;
} {
  const walletRaw = String(wallet || "");
  const walletNormalized = normalizeWallet(wallet);

  if (!walletNormalized) {
    return {
      walletRaw,
      walletNormalized,
      status: "missing",
      isValid: false,
      reason: "wallet_missing",
      canBeIncludedInCsv: false,
    };
  }

  if (walletNormalized.length < 32 || walletNormalized.length > 44) {
    return {
      walletRaw,
      walletNormalized,
      status: "invalid",
      isValid: false,
      reason: "wallet_length_invalid",
      canBeIncludedInCsv: false,
    };
  }

  if (!isLikelyBase58(walletNormalized)) {
    return {
      walletRaw,
      walletNormalized,
      status: "invalid",
      isValid: false,
      reason: "wallet_base58_invalid",
      canBeIncludedInCsv: false,
    };
  }

  return {
    walletRaw,
    walletNormalized,
    status: "valid",
    isValid: true,
    reason: null,
    canBeIncludedInCsv: true,
  };
}

export function buildWalletValidationRecord(params: {
  id: string;
  wallet: string | null | undefined;
  checkedAt?: number;
}): WalletValidationRecord {
  const checkedAt = params.checkedAt ?? Date.now();
  const result = getWalletValidationStatus(params.wallet);

  return {
    id: params.id,
    walletRaw: result.walletRaw,
    walletNormalized: result.walletNormalized,
    status: result.status,
    isValid: result.isValid,
    reason: result.reason,
    canBeIncludedInCsv: result.canBeIncludedInCsv,
    checkedAt,
  };
}

export function normalizeRewardWallet(wallet: string | null | undefined): string {
  return normalizeWallet(wallet);
}

export {};
