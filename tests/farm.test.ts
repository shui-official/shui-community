import { describe, it, expect } from "vitest";
import { Keypair, PublicKey } from "@solana/web3.js";
import { farmStateV6Layout, farmLedgerLayoutV6_1 } from "@raydium-io/raydium-sdk-v2";
import BN from "bn.js";
import { decodeFarmState, computePending, ledgerOf, buildFarmTx, type FarmState, type UserPosition } from "../src/lib/farm/farm";
import { RAYDIUM_FARM, TOKENS } from "../src/lib/solana/constants";
import { ValidationError } from "../src/lib/transactions/errors";
import { validateTransaction } from "../src/lib/transactions/validate";
import { farmExpectations } from "../src/lib/transactions/expectations";
import { OWNER, BH } from "./helpers";

function encodeFarm(over: Partial<{ lpMint: PublicKey; lpVault: PublicKey; rewardMint: PublicKey }> = {}) {
  const buf = Buffer.alloc(farmStateV6Layout.span);
  const r = (i: number) => ({ rewardState: new BN(i === 0 ? 1 : 0), rewardOpenTime: new BN(1000), rewardEndTime: new BN(2000), rewardLastUpdateTime: new BN(1000), totalReward: new BN(1_000_000), totalRewardEmissioned: new BN(0), rewardClaimed: new BN(0), rewardPerSecond: new BN(100), accRewardPerShare: new BN(0), rewardVault: i === 0 ? RAYDIUM_FARM.rewardVault : PublicKey.default, rewardMint: i === 0 ? (over.rewardMint ?? RAYDIUM_FARM.rewardMint) : PublicKey.default, rewardSender: PublicKey.default, rewardType: new BN(0), padding: Array(15).fill(new BN(0)) });
  farmStateV6Layout.encode({ state: new BN(1), nonce: new BN(252), validRewardTokenNum: new BN(1), rewardMultiplier: new BN(1_000_000_000), rewardPeriodMax: new BN(0), rewardPeriodMin: new BN(0), rewardPeriodExtend: new BN(0), lpMint: over.lpMint ?? RAYDIUM_FARM.lpMint, lpVault: over.lpVault ?? RAYDIUM_FARM.lpVault, rewardInfos: [0, 1, 2, 3, 4].map(r), creator: PublicKey.default, padding: Array(32).fill(new BN(0)) } as never, buf);
  return buf;
}

describe("Farm v6 : décodage et vérifications", () => {
  it("décode l'état attendu", () => {
    const s = decodeFarmState(RAYDIUM_FARM.programId, encodeFarm());
    expect(s.rewards.length).toBe(1); expect(s.rewards[0]?.mint.equals(TOKENS.SHUI.mint)).toBe(true); expect(s.multiplier).toBe(1_000_000_000n);
  });
  it("refuse un mauvais programme propriétaire", () => { expect(() => decodeFarmState(Keypair.generate().publicKey, encodeFarm())).toThrow(ValidationError); });
  it("refuse un mauvais LP mint", () => { expect(() => decodeFarmState(RAYDIUM_FARM.programId, encodeFarm({ lpMint: Keypair.generate().publicKey }))).toThrow(/LP mint/); });
  it("refuse une mauvaise mint de reward", () => { expect(() => decodeFarmState(RAYDIUM_FARM.programId, encodeFarm({ rewardMint: TOKENS.USDC.mint }))).toThrow(/Reward/); });
  it("layout ledger v6 = 296 octets", () => { expect(farmLedgerLayoutV6_1.span).toBe(296); });
});

describe("Farm v6 : rewards en attente (formule on-chain)", () => {
  const base = decodeFarmState(RAYDIUM_FARM.programId, encodeFarm());
  const state: FarmState = { ...base, totalStaked: 1_000n };
  it("seul staker : reçoit toute l'émission", () => { expect(computePending(state, 1_000n, [0n], 1100)[0]).toBe(10_000n); });
  it("prorata de la part", () => { expect(computePending(state, 250n, [0n], 1100)[0]).toBe(2_500n); });
  it("borné à la fin de campagne", () => { expect(computePending(state, 1_000n, [0n], 999_999)[0]).toBe(100_000n); });
  it("déduit la dette de reward", () => { expect(computePending(state, 1_000n, [4_000n], 1100)[0]).toBe(6_000n); });
  it("aucun dépôt → 0", () => { expect(computePending(state, 0n, [], 1100)[0]).toBe(0n); });
});

describe("Farm v6 : construction deposit / withdraw / claim", () => {
  const conn = { getLatestBlockhash: async () => ({ blockhash: BH, lastValidBlockHeight: 150 }) } as never;
  const pos = (o: Partial<UserPosition> = {}): UserPosition => ({ ledger: ledgerOf(OWNER.publicKey), exists: true, deposited: 500n, rewardDebts: [0n], walletLp: 1_000n, pending: [42n], ...o });

  it("deposit : instruction Farm v6 (tag 1) validée par le pipeline", async () => {
    const { tx } = await buildFarmTx(conn, OWNER.publicKey, "deposit", 100n, pos());
    expect(() => validateTransaction(tx, farmExpectations(OWNER.publicKey))).not.toThrow();
  });
  it("withdraw / claim : tag 2, claim = 0 LP", async () => {
    const w = await buildFarmTx(conn, OWNER.publicKey, "withdraw", 100n, pos());
    const c = await buildFarmTx(conn, OWNER.publicKey, "claim", 0n, pos());
    for (const { tx } of [w, c]) expect(() => validateTransaction(tx, farmExpectations(OWNER.publicKey))).not.toThrow();
  });
  it("LP insuffisants (wallet / farm)", async () => {
    await expect(buildFarmTx(conn, OWNER.publicKey, "deposit", 2_000n, pos())).rejects.toThrow(/LP insuffisants dans le wallet/);
    await expect(buildFarmTx(conn, OWNER.publicKey, "withdraw", 600n, pos())).rejects.toThrow(/LP insuffisants dans la Farm/);
    await expect(buildFarmTx(conn, OWNER.publicKey, "claim", 0n, pos({ deposited: 0n }))).rejects.toThrow(/Aucune position/);
    await expect(buildFarmTx(conn, OWNER.publicKey, "deposit", 0n, pos())).rejects.toThrow(/invalide/);
  });
  it("ledger PDA dérivé du Farm ID vérifié", () => {
    expect(ledgerOf(OWNER.publicKey).equals(ledgerOf(OWNER.publicKey))).toBe(true);
    expect(ledgerOf(OWNER.publicKey).equals(ledgerOf(Keypair.generate().publicKey))).toBe(false);
  });
});
