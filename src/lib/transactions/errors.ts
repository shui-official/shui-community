export class TxError extends Error {
  constructor(message: string, readonly code: string, readonly details?: unknown) { super(message); }
}
export class ValidationError extends TxError { constructor(m: string, d?: unknown) { super(m, "VALIDATION", d); } }
export class SimulationError extends TxError {
  constructor(readonly err: unknown, readonly logs: string[], readonly unitsConsumed?: number) {
    super(humanizeSimulation(err, logs), "SIMULATION", { err, logs, unitsConsumed });
  }
}
export class BlockhashExpiredError extends TxError { constructor() { super("La transaction a expiré avant signature. Aucune transaction n'a été envoyée — relancez l'opération.", "BLOCKHASH_EXPIRED"); } }
export class WalletError extends TxError { constructor(m: string) { super(m, "WALLET"); } }
export class ConfirmationError extends TxError { constructor(m: string, readonly signature: string) { super(m, "CONFIRMATION", { signature }); } }

/** Traduit une erreur de simulation en message compréhensible (sans jamais exposer de secret). */
export function humanizeSimulation(err: unknown, logs: string[]): string {
  const all = (logs || []).join("\n");
  if (/insufficient funds|insufficient lamports/i.test(all)) return "Solde insuffisant pour cette opération (montant ou frais réseau).";
  if (/slippage|ExceededSlippage|AmountOutBelowMinimum|0x1771|0x1786|TooLittleOutputReceived/i.test(all)) return "Le prix a bougé au-delà du slippage autorisé. Réessayez ou augmentez légèrement le slippage.";
  if (/AccountNotFound|could not find account/i.test(all) || JSON.stringify(err ?? "").includes("AccountNotFound")) return "Un compte requis est introuvable (solde nul ou compte non initialisé).";
  if (/BlockhashNotFound/i.test(JSON.stringify(err ?? ""))) return "Blockhash expiré. Relancez l'opération.";
  return "La simulation a échoué : l'opération n'a pas été proposée à la signature.";
}
