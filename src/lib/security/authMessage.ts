export const AUTH_ACTIONS = ["login"] as const;
export type AuthAction = typeof AUTH_ACTIONS[number];

export function buildLoginMessage(params: {
  domain: string;
  uri: string;
  wallet: string;
  nonce: string;
  issuedAt: string;
  expiration: string;
}) {
  return [
    "SHUI (水) — Secure Login",
    `Domain: ${params.domain}`,
    `URI: ${params.uri}`,
    "Action: login",
    `Wallet: ${params.wallet}`,
    `Nonce: ${params.nonce}`,
    `Issued At: ${params.issuedAt}`,
    `Expiration: ${params.expiration}`,
    "",
    "Note: No transaction is requested. This is a message signature to prove wallet ownership.",
  ].join("\n");
}

export function parseField(message: string, key: string) {
  const needle = `${key}: `;
  const line = message.split("\n").find((l) => l.startsWith(needle));
  return line ? line.slice(needle.length).trim() : null;
}

export function isIsoDate(s: string) {
  const t = Date.parse(s);
  return Number.isFinite(t);
}
