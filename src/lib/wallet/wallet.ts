/**
 * Connexion wallet navigateur — Phantom & Solflare via les adapters officiels.
 * Seule la clé PUBLIQUE est lue. Aucune seed, aucune clé privée : elles ne quittent jamais l'extension.
 *
 * Persistance entre pages : on mémorise UNIQUEMENT le nom du wallet choisi ("Phantom" | "Solflare").
 * À chaque page, on attend que l'extension soit détectée (readyState = Installed) puis on appelle
 * `adapter.autoConnect()` — mécanisme officiel du wallet-adapter : l'extension reconnecte sans
 * nouvelle demande si le site est déjà autorisé. Aucune signature n'est jamais demandée ici.
 *
 * La préférence n'est effacée QUE sur déconnexion explicite de l'utilisateur (bouton « Déconnecter »),
 * pas sur les événements `disconnect` émis par le SDK au déchargement de la page (beforeunload).
 *
 * Restauration rapide (fast-path) :
 * - lancée dès l'évaluation de ce module (avant l'évaluation des SDK Raydium/Orca et avant mountWallet) ;
 * - reconnexion IMMÉDIATE si l'extension est déjà détectée ;
 * - sinon, réaction à l'événement `readyStateChange` de l'adapter ou à l'apparition du provider injecté
 *   (vérification légère toutes les 100 ms), sans attendre le timeout ;
 * - le timeout (4 s) n'est plus qu'un filet de sécurité quand l'extension est absente ;
 * - une seule tentative par page (aucune boucle).
 *
 * Solflare — restauration via Wallet Standard (affichage uniquement) :
 * l'adapter officiel Solflare passe par un SDK + une iframe `connect.solflare.com` (~0,5–3 s à chaque page).
 * Pour un site DÉJÀ autorisé, on demande d'abord la clé publique directement à l'extension via
 * `standard:connect({ silent: true })` (jamais de fenêtre : un site non autorisé reçoit une liste vide).
 * La clé publique est affichée immédiatement ; l'adapter officiel se reconnecte en arrière-plan et reste
 * le SEUL canal de signature (chemin de signature inchangé). Signer attend cet adapter et refuse toute
 * divergence de compte. Si Wallet Standard est indisponible ou échoue → comportement précédent (adapter).
 */
import { PublicKey, type VersionedTransaction } from "@solana/web3.js";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { WalletReadyState, type BaseSignerWalletAdapter } from "@solana/wallet-adapter-base";

export type WalletId = "Phantom" | "Solflare";
export type WalletStatus = "idle" | "restoring" | "connected";

const adapters: Record<WalletId, BaseSignerWalletAdapter> = {
  Phantom: new PhantomWalletAdapter(),
  Solflare: new SolflareWalletAdapter({ network: "mainnet-beta" as never }),
};
type Listener = (pk: PublicKey | null, name: WalletId | null, status: WalletStatus) => void;
const listeners = new Set<Listener>();
let current: WalletId | null = null;
let status: WalletStatus = "idle";
let unloading = false;
const LS = "shui.wallet"; // nom du wallet uniquement — jamais de clé, seed, secret ou transaction
const RESTORE_TIMEOUT_MS = 4000;      // filet de sécurité uniquement (extension absente)
const PROVIDER_POLL_MS = 100;         // détection rapide d'un provider injecté tardivement
let restoreTimeoutMs = RESTORE_TIMEOUT_MS;
let restorePromise: Promise<void> | null = null;

// ---- Wallet Standard (Solflare, restauration silencieuse) ----
type StdAccount = { readonly publicKey: Uint8Array; readonly chains?: readonly string[] };
type StdConnect = { connect(input?: { silent?: boolean }): Promise<{ accounts: readonly StdAccount[] }> };
type StdEvents = { on(event: "change", listener: (p: { accounts?: readonly StdAccount[] }) => void): () => void };
type StdWallet = { readonly name: string; readonly chains: readonly string[]; readonly features: Readonly<Record<string, unknown>> };
const STD_GRACE_MS = 100;             // l'extension déjà injectée s'enregistre de façon synchrone ; délai de grâce minimal
let stdGraceMs = STD_GRACE_MS;
/** Clé publique restaurée via Wallet Standard — lecture/affichage uniquement, jamais utilisée pour signer. */
let fast: { pk: PublicKey; off?: () => void } | null = null;
/** Reconnexion en arrière-plan de l'adapter officiel (canal de signature). */
let adapterReady: Promise<boolean> | null = null;
/** Déconnexion explicite survenue pendant la reconnexion d'arrière-plan : ignorer son résultat. */
let bgCancelled = false;
const dropFast = () => { try { fast?.off?.(); } catch { /* ignoré */ } fast = null; };

const remember = (id: WalletId) => { try { localStorage.setItem(LS, id); } catch { /* stockage indisponible */ } };
const forget = () => { try { localStorage.removeItem(LS); } catch { /* stockage indisponible */ } };
export function rememberedWallet(): WalletId | null {
  let v: string | null = null;
  try { v = localStorage.getItem(LS); } catch { /* stockage indisponible */ }
  return v === "Phantom" || v === "Solflare" ? v : null;
}

function shownKey(): PublicKey | null {
  if (!current) return null;
  return adapters[current].publicKey ?? (current === "Solflare" ? fast?.pk ?? null : null);
}
function emit() {
  const pk = shownKey();
  listeners.forEach((l) => l(pk, current, status));
}
function setStatus(s: WalletStatus) { status = s; emit(); }

if (typeof window !== "undefined") {
  const mark = () => { unloading = true; };
  window.addEventListener("pagehide", mark);
  window.addEventListener("beforeunload", mark);
  window.addEventListener("pageshow", () => { unloading = false; });
}

for (const [id, a] of Object.entries(adapters) as [WalletId, BaseSignerWalletAdapter][]) {
  a.on("connect", () => {
    if (id === "Solflare" && bgCancelled) return; // reconnexion d'arrière-plan annulée par « Déconnecter »
    if (id === "Solflare") dropFast();              // l'adapter officiel prend le relais (clé + changements de compte)
    current = id; remember(id); setStatus("connected");
  });
  // Déconnexion NON initiée par l'utilisateur (déchargement de page, extension verrouillée…) :
  // on met à jour l'état affiché mais on conserve la préférence pour la page suivante.
  a.on("disconnect", () => { if (current === id) { current = null; if (!unloading) setStatus("idle"); } });
  a.on("error", () => { /* erreurs remontées par les appels connect()/signTransaction() */ });
}

export function onWallet(l: Listener) { listeners.add(l); l(shownKey(), current, status); return () => listeners.delete(l); }
export function walletList() {
  return (Object.keys(adapters) as WalletId[]).map((id) => ({ id, url: adapters[id].url, installed: [WalletReadyState.Installed, WalletReadyState.Loadable].includes(adapters[id].readyState) }));
}

/** Connexion explicite (clic utilisateur). */
export async function connect(id: WalletId) {
  if (current && current !== id) await disconnect();
  if (id === "Solflare") bgCancelled = false;
  await adapters[id].connect();
}
/** Déconnexion explicite : SEUL cas où la préférence est effacée. */
export async function disconnect() {
  forget();
  const a = current ? adapters[current] : null;
  if (current === "Solflare" && fast) bgCancelled = true;
  dropFast();
  current = null;
  try { await a?.disconnect(); } finally { setStatus("idle"); }
}
export function publicKey(): PublicKey | null { return shownKey(); }
export function currentWallet(): WalletId | null { return current; }
export function signer(): ((tx: VersionedTransaction) => Promise<VersionedTransaction>) | undefined {
  const a = current ? adapters[current] : null;
  // Chemin validé (Phantom, et Solflare dès que l'adapter est connecté) : strictement inchangé.
  if (a?.publicKey) return (tx) => a.signTransaction(tx);
  // Solflare restauré via Wallet Standard : on signe TOUJOURS via l'adapter officiel, une fois reconnecté.
  if (current !== "Solflare" || !fast || !a) return undefined;
  const shown = fast.pk;
  return async (tx) => {
    if (!a.publicKey && adapterReady) await adapterReady;
    if (!a.publicKey) throw new Error("Solflare n'est pas prêt pour la signature — reconnectez le wallet");
    if (!a.publicKey.equals(shown)) throw new Error("Le compte actif de Solflare a changé — vérifiez l'adresse puis réessayez");
    return a.signTransaction(tx);
  };
}

/**
 * Extension réellement présente dans la page ?
 * - état officiel de l'adapter (`Installed`) ;
 * - Solflare : provider injecté `window.solflare.isSolflare` (même critère que la détection de l'adapter,
 *   évaluable immédiatement, sans attendre son polling d'1 s ni l'événement `load`).
 * Le mode « Loadable » seul (popup web / redirection) n'est JAMAIS considéré comme détecté.
 */
function extensionDetected(id: WalletId): boolean {
  if (adapters[id].readyState === WalletReadyState.Installed) return true;
  if (id === "Solflare" && typeof window !== "undefined") {
    const w = window as unknown as { solflare?: { isSolflare?: boolean } };
    return !!w.solflare?.isSolflare;
  }
  return false;
}

/** Attend la détection de l'extension : immédiat si déjà présente, sinon événementiel, timeout en dernier recours. */
function waitForExtension(id: WalletId): Promise<boolean> {
  const a = adapters[id];
  if (extensionDetected(id)) return Promise.resolve(true);
  return new Promise<boolean>((resolve) => {
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return; done = true;
      clearTimeout(timer); clearInterval(poll); a.off("readyStateChange", onReady);
      resolve(ok);
    };
    const onReady = () => { if (extensionDetected(id)) finish(true); };
    a.on("readyStateChange", onReady);
    const poll = setInterval(onReady, PROVIDER_POLL_MS);
    const timer = setTimeout(() => finish(extensionDetected(id)), restoreTimeoutMs);
  });
}

/** Wallet Standard utilisable ? (navigateur, hors navigateur intégré de l'app Solflare → comportement historique). */
function standardUsable(): boolean {
  if (typeof window === "undefined" || typeof window.addEventListener !== "function" || typeof CustomEvent !== "function") return false;
  return !(window as unknown as { SolflareApp?: unknown }).SolflareApp;
}

/** Découverte Wallet Standard (protocole `wallet-standard:app-ready` / `register-wallet`), sans dépendance. */
function findStandardSolflare(graceMs: number): Promise<StdWallet | null> {
  return new Promise((resolve) => {
    let done = false;
    const isSolflare = (w: unknown): w is StdWallet => {
      const x = w as StdWallet | null;
      return !!x && x.name === "Solflare" && Array.isArray(x.chains) && x.chains.includes("solana:mainnet")
        && typeof (x.features?.["standard:connect"] as StdConnect | undefined)?.connect === "function";
    };
    const finish = (w: StdWallet | null) => {
      if (done) return; done = true;
      clearTimeout(timer); window.removeEventListener("wallet-standard:register-wallet", onRegister);
      resolve(w);
    };
    const api = { register: (...ws: unknown[]) => { const f = ws.find(isSolflare); if (f) finish(f); return () => {}; } };
    const onRegister = (e: Event) => { const cb = (e as CustomEvent).detail; if (typeof cb === "function") { try { cb(api); } catch { /* wallet défaillant */ } } };
    window.addEventListener("wallet-standard:register-wallet", onRegister);
    const timer = setTimeout(() => finish(null), graceMs);
    try { window.dispatchEvent(new CustomEvent("wallet-standard:app-ready", { detail: api })); } catch { /* ignoré */ }
  });
}

/**
 * Restauration Solflare rapide.
 * "restored"     : clé publique affichée, adapter en cours de reconnexion en arrière-plan ;
 * "unauthorized" : site non autorisé → état idle, AUCUN appel adapter (aucune fenêtre) ;
 * "fallback"     : Wallet Standard indisponible/en erreur → chemin historique (adapter.autoConnect).
 */
async function fastRestoreSolflare(): Promise<"restored" | "unauthorized" | "fallback"> {
  const std = await findStandardSolflare(stdGraceMs);
  if (!std) return "fallback";
  if (current) return "restored";
  let accounts: readonly StdAccount[];
  try { ({ accounts } = await (std.features["standard:connect"] as StdConnect).connect({ silent: true })); }
  catch { return "fallback"; }
  if (current) return "restored"; // connexion manuelle survenue entre-temps
  const acc = accounts.find((a) => a.chains?.includes("solana:mainnet")) ?? accounts[0];
  if (!acc) return "unauthorized";
  let pk: PublicKey;
  try { pk = new PublicKey(acc.publicKey); } catch { return "fallback"; }
  bgCancelled = false;
  fast = { pk };
  const events = std.features["standard:events"] as StdEvents | undefined;
  try {
    fast.off = events?.on("change", ({ accounts: next }) => {
      if (!fast || !next) return;
      const n = next.find((a) => a.chains?.includes("solana:mainnet")) ?? next[0];
      if (!n) { dropFast(); if (current === "Solflare" && !adapters.Solflare.publicKey) { current = null; setStatus("idle"); } return; }
      try { fast.pk = new PublicKey(n.publicKey); emit(); } catch { /* ignoré */ }
    });
  } catch { /* événements optionnels */ }
  current = "Solflare"; setStatus("connected");
  // Canal de signature : adapter officiel, reconnecté en arrière-plan (mécanisme validé, inchangé).
  adapterReady = adapters.Solflare.autoConnect().then(() => !!adapters.Solflare.publicKey, () => false).then((ok) => {
    if (bgCancelled) { if (ok) void adapters.Solflare.disconnect().catch(() => { /* ignoré */ }); return false; }
    if (!ok && current === "Solflare" && !adapters.Solflare.publicKey) { dropFast(); current = null; setStatus("idle"); }
    return ok;
  });
  return "restored";
}

async function restore(): Promise<void> {
  const id = rememberedWallet();
  if (!id || current) return;
  setStatus("restoring");
  if (!(await waitForExtension(id))) { if (!current) setStatus("idle"); return; }
  if (current) return; // connexion manuelle survenue entre-temps
  if (id === "Solflare" && standardUsable()) {
    const r = await fastRestoreSolflare();
    if (r === "restored") return;
    if (r === "unauthorized") { if (!current) setStatus("idle"); return; }
    if (current) return;
  }
  try { await adapters[id].autoConnect(); } catch { /* site non autorisé ou extension verrouillée : l'utilisateur reconnectera manuellement */ }
  if (!current) setStatus("idle");
}

/**
 * Restauration silencieuse au chargement de page (idempotente : une seule tentative par page).
 * - n'agit que si l'utilisateur avait choisi un wallet auparavant ;
 * - n'utilise JAMAIS le mode « Loadable » (popup / redirection) : uniquement l'extension installée ;
 * - aucune signature, aucune transaction.
 */
export function autoConnect(): Promise<void> {
  if (!restorePromise) restorePromise = restore();
  return restorePromise;
}

// Démarrage anticipé : dès l'évaluation de ce module, sans attendre le montage de l'interface.
if (typeof window !== "undefined" && typeof localStorage !== "undefined" && rememberedWallet()) void autoConnect();

/** @internal — exposé uniquement pour les tests unitaires (aucun usage applicatif). */
export const __testing = {
  adapters,
  markUnloading: (v: boolean) => { unloading = v; },
  /** Réinitialise l'état de la page (équivaut à charger un nouveau document). */
  resetPage: () => { restorePromise = null; current = null; status = "idle"; unloading = false; restoreTimeoutMs = RESTORE_TIMEOUT_MS; dropFast(); adapterReady = null; bgCancelled = false; stdGraceMs = STD_GRACE_MS; },
  setStdGrace: (ms: number) => { stdGraceMs = ms; },
  status: () => status,
  setRestoreTimeout: (ms: number) => { restoreTimeoutMs = ms; },
};
