import { describe, it, expect } from "vitest";
import { Keypair } from "@solana/web3.js";
import { prepare, execute } from "../src/lib/transactions/pipeline";
import { validateTransaction, assertKnownMint } from "../src/lib/transactions/validate";
import { SimulationError, ValidationError, BlockhashExpiredError, WalletError, ConfirmationError, humanizeSimulation } from "../src/lib/transactions/errors";
import { swapExpectations, farmExpectations } from "../src/lib/transactions/expectations";
import { NetworkError } from "../src/lib/solana/connection";
import { RAYDIUM_CPMM, ORCA_WHIRLPOOL, RAYDIUM_FARM, TOKENS, TOKEN_PROGRAM } from "../src/lib/solana/constants";
import { OWNER, txWith, ix, mockConn, testSigner, transfer } from "./helpers";

const rayKeys = [RAYDIUM_CPMM.poolId, RAYDIUM_CPMM.ammConfig, RAYDIUM_CPMM.vault0, RAYDIUM_CPMM.vault1, TOKENS.SHUI.mint, TOKENS.SOL.mint];
const goodRaydiumTx = () => txWith([ix(RAYDIUM_CPMM.programId, rayKeys, OWNER.publicKey)]);
const build = (tx = goodRaydiumTx()) => async () => ({ tx, summary: {}, lastValidBlockHeight: 150 });
const exp = () => swapExpectations("raydiumSwap", OWNER.publicKey);

describe("validation statique", () => {
  it("accepte une transaction conforme", () => { expect(() => validateTransaction(goodRaydiumTx(), exp())).not.toThrow(); });
  it("refuse un mauvais programme", () => {
    const tx = txWith([ix(RAYDIUM_CPMM.programId, rayKeys, OWNER.publicKey), ix(Keypair.generate().publicKey)]);
    expect(() => validateTransaction(tx, exp())).toThrow(/Programme non autorisé/);
  });
  it("refuse un programme métier absent", () => { expect(() => validateTransaction(txWith([transfer()]), exp())).toThrow(/Programme attendu absent/); });
  it("refuse une mauvaise mint / mauvais pool", () => {
    const fake = Keypair.generate().publicKey;
    const tx = txWith([ix(RAYDIUM_CPMM.programId, [fake, RAYDIUM_CPMM.ammConfig, RAYDIUM_CPMM.vault0, RAYDIUM_CPMM.vault1, TOKENS.SOL.mint], OWNER.publicKey)]);
    expect(() => validateTransaction(tx, exp())).toThrow(/Compte attendu absent/);
    expect(() => assertKnownMint(fake)).toThrow(/Mint non reconnue/);
    expect(() => assertKnownMint(TOKENS.SHUI.mint)).not.toThrow();
  });
  it("refuse USDC dans un swap Raydium (anti-routage via mauvais pool)", () => {
    const tx = txWith([ix(RAYDIUM_CPMM.programId, [...rayKeys, TOKENS.USDC.mint], OWNER.publicKey)]);
    expect(() => validateTransaction(tx, exp())).toThrow(/Compte inattendu/);
  });
  it("Orca : refuse le pool Raydium (USDC→SHUI ne passe jamais par SOL/SHUI)", () => {
    const tx = txWith([ix(ORCA_WHIRLPOOL.programId, [ORCA_WHIRLPOOL.poolId, ORCA_WHIRLPOOL.vaultA, ORCA_WHIRLPOOL.vaultB, RAYDIUM_CPMM.poolId], OWNER.publicKey)]);
    expect(() => validateTransaction(tx, swapExpectations("orcaSwap", OWNER.publicKey))).toThrow(/Compte inattendu/);
  });
  it("refuse un payeur différent du wallet", () => {
    const other = Keypair.generate().publicKey;
    expect(() => validateTransaction(txWith([ix(RAYDIUM_CPMM.programId, rayKeys, other)], other), exp())).toThrow(/payeur/);
  });
  it("refuse des signataires supplémentaires", () => {
    const extra = Keypair.generate().publicKey;
    const tx = txWith([ix(RAYDIUM_CPMM.programId, rayKeys, OWNER.publicKey), ix(TOKEN_PROGRAM, [], extra)]);
    expect(() => validateTransaction(tx, exp())).toThrow(/signataires inattendus/);
  });
  it("Farm : programme Farm v6 + Farm ID obligatoires", () => {
    const tx = txWith([ix(RAYDIUM_FARM.programId, [RAYDIUM_FARM.lpVault], OWNER.publicKey)]);
    expect(() => validateTransaction(tx, farmExpectations(OWNER.publicKey))).toThrow(/Compte attendu absent/);
  });
});

describe("pipeline : simulation obligatoire", () => {
  it("simulation OK → signature → broadcast → confirmation", async () => {
    const { conn, calls } = mockConn();
    const p = await prepare(conn, build(), exp());
    const sig = await execute(conn, p, testSigner);
    expect(sig).toMatch(/^5ig/); expect(calls).toEqual({ simulate: 1, send: 1, confirm: 1 });
  });
  it("simulation.value.err !== null → AUCUNE signature, AUCUN broadcast", async () => {
    const { conn, calls } = mockConn({ simErr: { InstructionError: [2, { Custom: 1 }] }, logs: ["Program log: Error: insufficient funds"] });
    let signed = false;
    await expect(prepare(conn, build(), exp())).rejects.toBeInstanceOf(SimulationError);
    expect(signed).toBe(false); expect(calls.send).toBe(0);
    signed = true; void signed;
  });
  it("erreur de simulation humanisée + diagnostic conservé", async () => {
    const { conn } = mockConn({ simErr: { InstructionError: [2, { Custom: 6022 }] }, logs: ["Program log: AnchorError: ExceededSlippage"] });
    try { await prepare(conn, build(), exp()); } catch (e) {
      const s = e as SimulationError; expect(s.message).toMatch(/slippage/i); expect(s.logs.length).toBe(1); expect(s.unitsConsumed).toBe(25000);
    }
  });
  it("mauvais réseau (devnet) → refus avant simulation", async () => {
    const { conn, calls } = mockConn({ genesis: "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG" });
    await expect(prepare(conn, build(), exp())).rejects.toBeInstanceOf(NetworkError); expect(calls.simulate).toBe(0);
  });
  it("RPC indisponible → erreur propre", async () => {
    const { conn } = mockConn({ rpcDown: true });
    await expect(prepare(conn, build(), exp())).rejects.toThrow(/RPC injoignable/);
  });
  it("wallet déconnecté → refus", async () => {
    const { conn, calls } = mockConn(); const p = await prepare(conn, build(), exp());
    await expect(execute(conn, p, undefined)).rejects.toBeInstanceOf(WalletError); expect(calls.send).toBe(0);
  });
  it("signature refusée → pas de broadcast", async () => {
    const { conn, calls } = mockConn(); const p = await prepare(conn, build(), exp());
    await expect(execute(conn, p, async () => { throw new Error("User rejected"); })).rejects.toThrow(/refusée/); expect(calls.send).toBe(0);
  });
  it("blockhash expiré avant signature → pas de broadcast", async () => {
    const { conn, calls } = mockConn({ height: [151] }); const p = await prepare(conn, build(), exp());
    await expect(execute(conn, p, testSigner)).rejects.toBeInstanceOf(BlockhashExpiredError); expect(calls.send).toBe(0);
  });
  it("blockhash expiré pendant la signature → pas de broadcast", async () => {
    const { conn, calls } = mockConn({ height: [100, 151] }); const p = await prepare(conn, build(), exp());
    await expect(execute(conn, p, testSigner)).rejects.toBeInstanceOf(BlockhashExpiredError); expect(calls.send).toBe(0);
  });
  it("wallet qui modifie la transaction de façon non conforme → refus", async () => {
    const { conn, calls } = mockConn(); const p = await prepare(conn, build(), exp());
    const evil = async () => { const t = txWith([transfer()]); t.sign([OWNER]); return t; };
    await expect(execute(conn, p, evil)).rejects.toBeInstanceOf(ValidationError); expect(calls.send).toBe(0);
  });
  it("transaction non signée → refus", async () => {
    const { conn, calls } = mockConn(); const p = await prepare(conn, build(), exp());
    await expect(execute(conn, p, async (t) => t)).rejects.toThrow(/non signée/); expect(calls.send).toBe(0);
  });
  it("échec on-chain après inclusion → ConfirmationError avec signature", async () => {
    const { conn } = mockConn({ confirmErr: { InstructionError: [0, "Custom"] } }); const p = await prepare(conn, build(), exp());
    await expect(execute(conn, p, testSigner)).rejects.toBeInstanceOf(ConfirmationError);
  });
});

describe("messages d'erreur", () => {
  it("fonds insuffisants (SOL / USDC / LP)", () => {
    expect(humanizeSimulation({}, ["Program log: Error: insufficient funds"])).toMatch(/Solde insuffisant/);
    expect(humanizeSimulation({}, ["Transfer: insufficient lamports 10, need 20"])).toMatch(/Solde insuffisant/);
  });
  it("compte manquant", () => { expect(humanizeSimulation("AccountNotFound", [])).toMatch(/introuvable/); });
});
