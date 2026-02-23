import type { PublicKey } from "@solana/web3.js";

export function buildHubUrl(baseUrl: string, publicKey?: PublicKey | null) {
  const url = baseUrl || "http://localhost:3001";
  if (!publicKey) return url;

  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}wallet=${encodeURIComponent(publicKey.toBase58())}`;
}
