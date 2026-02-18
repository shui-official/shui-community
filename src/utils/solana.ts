import { Connection, PublicKey } from "@solana/web3.js";

export const SHUI_MINT = new PublicKey(
  "CnrMgNn1N3uY6GqD6FeZRdd1uhPViEFxSioWhRZsCz4C"
);

export function getConnection() {
  const rpc =
    process.env.NEXT_PUBLIC_SOLANA_RPC ?? "https://api.mainnet-beta.solana.com";
  return new Connection(rpc, "confirmed");
}

export async function getShuiBalance(owner: PublicKey): Promise<number> {
  const connection = getConnection();

  const res = await connection.getParsedTokenAccountsByOwner(owner, {
    mint: SHUI_MINT,
  });

  if (!res.value.length) return 0;

  const uiAmount =
    res.value[0].account.data.parsed.info.tokenAmount.uiAmount ?? 0;

  return uiAmount;
}
