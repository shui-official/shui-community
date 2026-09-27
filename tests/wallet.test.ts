import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { PublicKey } from "@solana/web3.js";

// localStorage minimal (environnement node)
const store = new Map<string, string>();
vi.stubGlobal("localStorage", { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) });

const w = await import("../src/lib/wallet/wallet");
const { adapters } = w.__testing;
const fakePk = { toBase58: () => "SoLFaKePubKey1111111111111111111111111111111" };
type Mut = { _readyState: WalletReadyState };
const setReady = (id: "Phantom" | "Solflare", s: WalletReadyState, emit = false) => {
  (adapters[id] as unknown as Mut)._readyState = s;
  if (emit) adapters[id].emit("readyStateChange", s);
};
/** Simule un autoConnect accepté par l'extension (site déjà autorisé) : émet 'connect', aucune signature. */
const acceptingAutoConnect = (id: "Phantom" | "Solflare") =>
  vi.spyOn(adapters[id], "autoConnect").mockImplementation(async () => { adapters[id].emit("connect", fakePk as never); });

describe("persistance wallet entre pages", () => {
  beforeEach(() => {
    store.clear(); w.__testing.resetPage();
    setReady("Phantom", WalletReadyState.Unsupported); setReady("Solflare", WalletReadyState.Unsupported);
    Object.defineProperty(adapters.Solflare, "publicKey", { configurable: true, get: () => fakePk });
    Object.defineProperty(adapters.Phantom, "publicKey", { configurable: true, get: () => fakePk });
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it("mémorise UNIQUEMENT le nom du wallet à la connexion", () => {
    adapters.Solflare.emit("connect", fakePk as never);
    expect([...store.entries()]).toEqual([["shui.wallet", "Solflare"]]);
    expect(w.currentWallet()).toBe("Solflare");
  });

  it("1. wallet mémorisé + extension déjà détectée → autoConnect immédiat (aucune attente)", async () => {
    store.set("shui.wallet", "Solflare");
    setReady("Solflare", WalletReadyState.Installed);
    const spy = acceptingAutoConnect("Solflare");
    const t0 = Date.now();
    const p = w.autoConnect();
    await Promise.resolve(); await Promise.resolve();
    expect(spy).toHaveBeenCalledTimes(1);
    await p;
    expect(Date.now() - t0).toBeLessThan(50);
    expect(w.currentWallet()).toBe("Solflare");
    expect(w.__testing.status()).toBe("connected");
  });

  it("2. extension détectée après readyStateChange → reconnexion dès l'événement, sans attendre le timeout", async () => {
    store.set("shui.wallet", "Phantom");
    setReady("Phantom", WalletReadyState.Loadable); // Loadable seul ≠ détectée
    const spy = acceptingAutoConnect("Phantom");
    const t0 = Date.now();
    const p = w.autoConnect();
    expect(w.__testing.status()).toBe("restoring");
    await new Promise((r) => setTimeout(r, 30));
    expect(spy).not.toHaveBeenCalled(); // pas de popup en mode Loadable
    setReady("Phantom", WalletReadyState.Installed, true);
    await p;
    expect(spy).toHaveBeenCalledTimes(1);
    expect(Date.now() - t0).toBeLessThan(500); // bien avant le timeout de 4 s
    expect(w.currentWallet()).toBe("Phantom");
  });

  it("3. extension absente → timeout propre puis état idle, aucun autoConnect", async () => {
    store.set("shui.wallet", "Solflare");
    w.__testing.setRestoreTimeout(60);
    setReady("Solflare", WalletReadyState.Loadable); // pas d'extension : seul le mode web popup existerait
    const spy = vi.spyOn(adapters.Solflare, "autoConnect");
    await w.autoConnect();
    expect(spy).not.toHaveBeenCalled();
    expect(w.__testing.status()).toBe("idle");
    expect(w.rememberedWallet()).toBe("Solflare"); // préférence conservée pour une prochaine visite
  });

  it("4. extension verrouillée / refus → une seule tentative, aucune boucle, état idle", async () => {
    store.set("shui.wallet", "Solflare");
    setReady("Solflare", WalletReadyState.Installed);
    const spy = vi.spyOn(adapters.Solflare, "autoConnect").mockRejectedValue(new Error("User rejected / locked"));
    await w.autoConnect();
    await w.autoConnect(); await w.autoConnect(); // appels répétés (ex. remontage UI)
    await new Promise((r) => setTimeout(r, 250));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(w.__testing.status()).toBe("idle");
    expect(w.currentWallet()).toBeNull();
  });

  it("5. déconnexion EXPLICITE → préférence supprimée", async () => {
    adapters.Solflare.emit("connect", fakePk as never);
    vi.spyOn(adapters.Solflare, "disconnect").mockResolvedValue();
    await w.disconnect();
    expect(w.rememberedWallet()).toBeNull();
    expect(w.currentWallet()).toBeNull();
  });

  it("6a. 'disconnect' émis pendant pagehide/beforeunload → préférence conservée", () => {
    adapters.Solflare.emit("connect", fakePk as never);
    w.__testing.markUnloading(true);
    adapters.Solflare.emit("disconnect");
    expect(w.rememberedWallet()).toBe("Solflare");
  });

  it("6b. 'disconnect' non explicite (extension verrouillée) → préférence conservée", () => {
    adapters.Solflare.emit("connect", fakePk as never);
    adapters.Solflare.emit("disconnect");
    expect(w.currentWallet()).toBeNull();
    expect(w.rememberedWallet()).toBe("Solflare");
  });

  it("7. aucun wallet mémorisé → aucun autoConnect", async () => {
    setReady("Solflare", WalletReadyState.Installed); setReady("Phantom", WalletReadyState.Installed);
    const s1 = vi.spyOn(adapters.Solflare, "autoConnect"), s2 = vi.spyOn(adapters.Phantom, "autoConnect");
    await w.autoConnect();
    expect(s1).not.toHaveBeenCalled(); expect(s2).not.toHaveBeenCalled();
    expect(w.__testing.status()).toBe("idle");
  });

  it("valeur stockée inconnue ignorée", () => { store.set("shui.wallet", "EvilWallet"); expect(w.rememberedWallet()).toBeNull(); });
});

// ---------------------------------------------------------------------------
// Solflare — restauration silencieuse via Wallet Standard (affichage), signature via l'adapter officiel.
// ---------------------------------------------------------------------------
describe("Solflare : restauration rapide Wallet Standard", () => {
  const KA = new PublicKey(new Uint8Array(32).fill(7));
  const KB = new PublicKey(new Uint8Array(32).fill(9));
  const acct = (k: PublicKey) => ({ publicKey: k.toBytes(), chains: ["solana:mainnet"] });
  let win: EventTarget & Record<string, unknown>;
  let sfPk: PublicKey | null; // clé publique de l'adapter officiel (null tant qu'il n'est pas reconnecté)
  let changeListeners: ((p: { accounts?: unknown[] }) => void)[];
  let stdConnect: ReturnType<typeof vi.fn>;

  /** Enregistre une fausse extension Solflare conforme Wallet Standard (aucune clé privée). */
  const registerStd = (connectImpl: (i?: { silent?: boolean }) => Promise<{ accounts: unknown[] }>) => {
    stdConnect = vi.fn(connectImpl);
    const std = { name: "Solflare", version: "1.0.0", chains: ["solana:mainnet"], accounts: [], icon: "data:,",
      features: { "standard:connect": { version: "1.0.0", connect: stdConnect },
                  "standard:events": { version: "1.0.0", on: (_e: string, l: (p: { accounts?: unknown[] }) => void) => { changeListeners.push(l); return () => { changeListeners = changeListeners.filter((x) => x !== l); }; } } } };
    win.addEventListener("wallet-standard:app-ready", (e) => (e as CustomEvent).detail.register(std));
  };
  /** Adapter officiel : reconnexion (iframe) simulée avec un délai ; émet 'connect' comme l'adapter réel. */
  const adapterAutoConnect = (key: PublicKey, delayMs = 150, fail = false) =>
    vi.spyOn(adapters.Solflare, "autoConnect").mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, delayMs));
      if (fail) throw new Error("iframe timeout");
      sfPk = key; adapters.Solflare.emit("connect", key as never);
    });
  const flush = () => new Promise((r) => setTimeout(r, 0));

  beforeEach(() => {
    store.clear(); w.__testing.resetPage();
    win = Object.assign(new EventTarget(), {}) as EventTarget & Record<string, unknown>;
    vi.stubGlobal("window", win);
    sfPk = null; changeListeners = [];
    setReady("Phantom", WalletReadyState.Unsupported); setReady("Solflare", WalletReadyState.Installed);
    Object.defineProperty(adapters.Solflare, "publicKey", { configurable: true, get: () => sfPk });
    Object.defineProperty(adapters.Phantom, "publicKey", { configurable: true, get: () => null });
    store.set("shui.wallet", "Solflare");
  });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.stubGlobal("localStorage", { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) }); });

  it("S1. site déjà autorisé → clé restaurée silencieusement, sans attendre l'iframe de l'adapter", async () => {
    registerStd(async () => ({ accounts: [acct(KA)] }));
    const bg = adapterAutoConnect(KA, 300);
    const t0 = Date.now();
    await w.autoConnect();
    expect(Date.now() - t0).toBeLessThan(50);                 // l'adapter (300 ms) n'est pas attendu
    expect(stdConnect).toHaveBeenCalledTimes(1);
    expect(stdConnect).toHaveBeenCalledWith({ silent: true }); // jamais de demande interactive
    expect(w.__testing.status()).toBe("connected");
    expect(w.currentWallet()).toBe("Solflare");
    expect(w.publicKey()?.equals(KA)).toBe(true);
    expect(bg).toHaveBeenCalledTimes(1);                      // canal de signature reconnecté en arrière-plan
    expect(adapters.Solflare.publicKey).toBeNull();
    await new Promise((r) => setTimeout(r, 350));
    expect(adapters.Solflare.publicKey?.equals(KA)).toBe(true);
    expect(w.publicKey()?.equals(KA)).toBe(true);
  });

  it("S2. site non autorisé → aucune fenêtre : ni connect() ni autoConnect() de l'adapter, état idle", async () => {
    registerStd(async () => ({ accounts: [] }));
    const ac = vi.spyOn(adapters.Solflare, "autoConnect"), c = vi.spyOn(adapters.Solflare, "connect");
    await w.autoConnect();
    expect(stdConnect).toHaveBeenCalledWith({ silent: true });
    expect(ac).not.toHaveBeenCalled(); expect(c).not.toHaveBeenCalled();
    expect(w.__testing.status()).toBe("idle");
    expect(w.publicKey()).toBeNull();
    expect(w.rememberedWallet()).toBe("Solflare");
  });

  it("S3a. Wallet Standard absent → repli sur le chemin historique (adapter.autoConnect)", async () => {
    w.__testing.setStdGrace(20);
    const bg = adapterAutoConnect(KA, 10);
    await w.autoConnect();
    expect(bg).toHaveBeenCalledTimes(1);
    expect(w.__testing.status()).toBe("connected");
    expect(w.publicKey()?.equals(KA)).toBe(true);
  });

  it("S3b. standard:connect en erreur → repli sur l'adapter", async () => {
    registerStd(async () => { throw new Error("not supported"); });
    const bg = adapterAutoConnect(KA, 10);
    await w.autoConnect();
    expect(bg).toHaveBeenCalledTimes(1);
    expect(w.publicKey()?.equals(KA)).toBe(true);
  });

  it("S3c. navigateur intégré de l'app Solflare (window.SolflareApp) → comportement historique, Wallet Standard non utilisé", async () => {
    win.SolflareApp = {};
    registerStd(async () => ({ accounts: [acct(KA)] }));
    const bg = adapterAutoConnect(KA, 10);
    await w.autoConnect();
    expect(stdConnect).not.toHaveBeenCalled();
    expect(bg).toHaveBeenCalledTimes(1);
  });

  it("S4. Phantom inchangé : Wallet Standard jamais sollicité, adapter Phantom + signature Phantom", async () => {
    store.set("shui.wallet", "Phantom");
    setReady("Phantom", WalletReadyState.Installed);
    registerStd(async () => ({ accounts: [acct(KA)] }));
    let phPk: PublicKey | null = null;
    Object.defineProperty(adapters.Phantom, "publicKey", { configurable: true, get: () => phPk });
    const ph = vi.spyOn(adapters.Phantom, "autoConnect").mockImplementation(async () => { phPk = KB; adapters.Phantom.emit("connect", KB as never); });
    const sign = vi.spyOn(adapters.Phantom, "signTransaction").mockImplementation(async (tx) => tx);
    await w.autoConnect();
    expect(stdConnect).not.toHaveBeenCalled();
    expect(ph).toHaveBeenCalledTimes(1);
    expect(w.currentWallet()).toBe("Phantom");
    const tx = {} as never;
    await w.signer()!(tx);
    expect(sign).toHaveBeenCalledWith(tx);
  });

  it("S5. signature : attend l'adapter officiel puis signe via adapter.signTransaction (chemin inchangé)", async () => {
    registerStd(async () => ({ accounts: [acct(KA)] }));
    adapterAutoConnect(KA, 80);
    const sign = vi.spyOn(adapters.Solflare, "signTransaction").mockImplementation(async (tx) => tx);
    await w.autoConnect();
    const s = w.signer();
    expect(s).toBeDefined();
    const tx = {} as never;
    await s!(tx);
    expect(sign).toHaveBeenCalledTimes(1);
    expect(sign).toHaveBeenCalledWith(tx);
  });

  it("S6. déconnexion explicite pendant la reconnexion d'arrière-plan → préférence effacée, résultat de l'adapter ignoré", async () => {
    registerStd(async () => ({ accounts: [acct(KA)] }));
    adapterAutoConnect(KA, 80);
    const disc = vi.spyOn(adapters.Solflare, "disconnect").mockResolvedValue();
    await w.autoConnect();
    expect(w.currentWallet()).toBe("Solflare");
    await w.disconnect();
    expect(w.rememberedWallet()).toBeNull();
    expect(w.currentWallet()).toBeNull();
    expect(w.publicKey()).toBeNull();
    await new Promise((r) => setTimeout(r, 120));
    expect(w.currentWallet()).toBeNull();          // le 'connect' tardif de l'adapter n'a pas reconnecté
    expect(w.__testing.status()).toBe("idle");
    expect(disc).toHaveBeenCalled();               // l'adapter reconnecté en arrière-plan est refermé
    expect(changeListeners).toHaveLength(0);       // écouteur Wallet Standard retiré
  });

  it("S7a. changement de compte dans l'extension → adresse affichée mise à jour", async () => {
    registerStd(async () => ({ accounts: [acct(KA)] }));
    adapterAutoConnect(KA, 500);
    await w.autoConnect();
    const seen: (string | null)[] = [];
    w.onWallet((pk) => seen.push(pk?.toBase58() ?? null));
    changeListeners.forEach((l) => l({ accounts: [acct(KB)] }));
    expect(w.publicKey()?.equals(KB)).toBe(true);
    expect(seen.at(-1)).toBe(KB.toBase58());
  });

  it("S7b. compte changé → la signature est REFUSÉE si l'adapter n'est pas sur le compte affiché", async () => {
    registerStd(async () => ({ accounts: [acct(KA)] }));
    adapterAutoConnect(KA, 60);                     // l'adapter se reconnecte sur KA
    const sign = vi.spyOn(adapters.Solflare, "signTransaction").mockImplementation(async (tx) => tx);
    await w.autoConnect();
    changeListeners.forEach((l) => l({ accounts: [acct(KB)] })); // l'utilisateur affiche désormais KB
    const s = w.signer()!;
    await expect(s({} as never)).rejects.toThrow(/compte actif de Solflare a changé/);
    expect(sign).not.toHaveBeenCalled();
  });

  it("S7c. extension verrouillée / comptes retirés → état idle", async () => {
    registerStd(async () => ({ accounts: [acct(KA)] }));
    adapterAutoConnect(KA, 500);
    await w.autoConnect();
    changeListeners.forEach((l) => l({ accounts: [] }));
    expect(w.currentWallet()).toBeNull();
    expect(w.__testing.status()).toBe("idle");
    expect(w.rememberedWallet()).toBe("Solflare");
  });

  it("S8. échec de la reconnexion d'arrière-plan (iframe/timeout) → état idle, aucune signature possible", async () => {
    registerStd(async () => ({ accounts: [acct(KA)] }));
    adapterAutoConnect(KA, 30, true);
    await w.autoConnect();
    expect(w.__testing.status()).toBe("connected");
    await new Promise((r) => setTimeout(r, 60)); await flush();
    expect(w.__testing.status()).toBe("idle");
    expect(w.currentWallet()).toBeNull();
    expect(w.signer()).toBeUndefined();
    expect(w.rememberedWallet()).toBe("Solflare");
  });

  it("S9. aucune double tentative : 3 appels → 1 standard:connect, 1 autoConnect adapter", async () => {
    registerStd(async () => ({ accounts: [acct(KA)] }));
    const bg = adapterAutoConnect(KA, 30);
    await Promise.all([w.autoConnect(), w.autoConnect(), w.autoConnect()]);
    await w.autoConnect();
    await new Promise((r) => setTimeout(r, 60));
    expect(stdConnect).toHaveBeenCalledTimes(1);
    expect(bg).toHaveBeenCalledTimes(1);
    expect(w.currentWallet()).toBe("Solflare");
  });

  it("S10. seule la préférence (nom du wallet) est stockée, jamais de clé", async () => {
    registerStd(async () => ({ accounts: [acct(KA)] }));
    adapterAutoConnect(KA, 10);
    await w.autoConnect();
    await new Promise((r) => setTimeout(r, 30));
    expect([...store.entries()]).toEqual([["shui.wallet", "Solflare"]]);
  });
});
