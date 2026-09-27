import { Keypair, PublicKey, SystemProgram, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { MAINNET_GENESIS_HASH } from "../src/lib/solana/constants";
import type { Conn } from "../src/lib/transactions/pipeline";

export const OWNER = Keypair.generate(); // clé éphémère locale de TEST uniquement — jamais un wallet réel
export const BH = "GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi";

export function txWith(ixs: TransactionInstruction[], payer: PublicKey = OWNER.publicKey) {
  return new VersionedTransaction(new TransactionMessage({ payerKey: payer, recentBlockhash: BH, instructions: ixs }).compileToV0Message());
}
export function ix(programId: PublicKey, keys: PublicKey[] = [], signer?: PublicKey) {
  return new TransactionInstruction({ programId, data: Buffer.from([1]), keys: [...(signer ? [{ pubkey: signer, isSigner: true, isWritable: true }] : []), ...keys.map((k) => ({ pubkey: k, isSigner: false, isWritable: true }))] });
}
export const transfer = () => SystemProgram.transfer({ fromPubkey: OWNER.publicKey, toPubkey: Keypair.generate().publicKey, lamports: 1 });

export interface MockOpts { genesis?: string; simErr?: unknown; logs?: string[]; height?: number[]; confirmErr?: unknown; rpcDown?: boolean }
export function mockConn(o: MockOpts = {}) {
  const calls = { simulate: 0, send: 0, confirm: 0 };
  const heights = [...(o.height ?? [100, 100])];
  const conn: Conn = {
    getGenesisHash: async () => { if (o.rpcDown) throw new Error("fetch failed"); return o.genesis ?? MAINNET_GENESIS_HASH; },
    simulateTransaction: (async () => { calls.simulate++; return { context: { slot: 1 }, value: { err: o.simErr ?? null, logs: o.logs ?? ["Program log: ok"], unitsConsumed: 25000, accounts: null, returnData: null } }; }) as unknown as Conn["simulateTransaction"],
    getBlockHeight: async () => heights.shift() ?? 100,
    sendRawTransaction: async () => { calls.send++; return "5igSimulatedSignatureForUnitTestsOnly1111111111111111111111111111"; },
    confirmTransaction: (async () => { calls.confirm++; return { context: { slot: 2 }, value: { err: o.confirmErr ?? null } }; }) as unknown as Conn["confirmTransaction"],
    getLatestBlockhash: async () => ({ blockhash: BH, lastValidBlockHeight: 150 }),
  };
  return { conn, calls };
}
/** Signataire de TEST : signe avec la clé éphémère locale (simule Phantom). */
export const testSigner = async (tx: VersionedTransaction) => { tx.sign([OWNER]); return tx; };
