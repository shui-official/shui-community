export const SHUI_DECIMALS = 9;

export const REWARDS_IMMEDIATE_RATIO = 0.25;
export const REWARDS_VESTING_RATIO = 0.75;

export const REWARDS_VESTING_MONTHS = 6;

export const REWARD_BATCH_STATUSES = ["draft", "generated", "finalized", "cancelled"] as const;
export const REWARD_SNAPSHOT_STATUSES = ["draft", "finalized", "blocked"] as const;
export const WALLET_VALIDATION_STATUSES = ["valid", "invalid", "missing"] as const;
export const VESTING_SCHEDULE_STATUSES = ["active", "completed", "blocked", "cancelled"] as const;
export const VESTING_INSTALLMENT_STATUSES = ["pending", "ready", "exported", "sent", "blocked", "completed"] as const;
export const DISTRIBUTION_LEDGER_STATUSES = ["pending", "exported", "sent", "blocked", "completed"] as const;
export const DISTRIBUTION_ENTRY_TYPES = ["immediate", "vesting"] as const;

export {};
