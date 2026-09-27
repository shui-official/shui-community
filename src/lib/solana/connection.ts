import { Connection } from "@solana/web3.js";
import { DEFAULT_RPC, MAINNET_GENESIS_HASH } from "./constants";

export class NetworkError extends Error {}

let _conn: Connection | null = null;
export function rpcUrl(): string {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  return env?.VITE_SOLANA_RPC || DEFAULT_RPC;
}
export function getConnection(): Connection {
  if (!_conn) _conn = new Connection(rpcUrl(), { commitment: "confirmed" });
  return _conn;
}

/** Refuse toute opération si le RPC n'est pas Solana Mainnet. */
export async function assertMainnet(conn: Pick<Connection, "getGenesisHash">): Promise<void> {
  let hash: string;
  try { hash = await conn.getGenesisHash(); } catch (e) { throw new NetworkError("RPC injoignable : " + (e as Error).message); }
  if (hash !== MAINNET_GENESIS_HASH) throw new NetworkError("Réseau incorrect : Solana Mainnet requis");
}
