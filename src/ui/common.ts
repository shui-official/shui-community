/** Utilitaires UI partagés (pages Swap / Farm). Aucune logique de transaction ici. */
import { connect, disconnect, onWallet, walletList, autoConnect, publicKey, currentWallet, type WalletId } from "../lib/wallet/wallet";
import { TxError, SimulationError, ConfirmationError, WalletError } from "../lib/transactions/errors";
import { setDiagnostics } from "../lib/transactions/pipeline";

export const $ = <T extends HTMLElement = HTMLElement>(id: string) => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} manquant`);
  return el as T;
};
export const short = (s: string) => `${s.slice(0, 4)}…${s.slice(-4)}`;

/** Mode diagnostic : ?debug=1 → conserve err / logs / unitsConsumed dans la console (données publiques uniquement). */
export const DEBUG = new URLSearchParams(location.search).has("debug");
if (DEBUG) setDiagnostics((e) => console.info("[SHUI diag]", e.stage, { err: e.err, unitsConsumed: e.unitsConsumed, logs: e.logs }));

let tt: number | undefined;
export function toast(msg: string) {
  const t = $("toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(tt); tt = window.setTimeout(() => t.classList.remove("show"), 2200);
}

function esc(s: string) { return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string); }

export function setStatus(kind: "info" | "ok" | "err" | "hide", html = "") {
  const s = $("status");
  s.className = "status" + (kind === "hide" ? "" : " show") + (kind === "ok" ? " is-ok" : kind === "err" ? " is-err" : "");
  s.innerHTML = html;
}
export function statusText(kind: "info" | "ok" | "err", text: string) { setStatus(kind, esc(text)); }

/** Message lisible pour les erreurs RPC / réseau (sans détail technique brut). */
export function friendlyMessage(e: unknown): string {
  const raw = (e as Error)?.message || "";
  if (e instanceof WalletError && /reject|refus|annul|cancel|denied|declined/i.test(raw)) return "Transaction refusée dans le wallet. Aucune transaction n'a été envoyée.";
  if (e instanceof TxError) return e.message;
  if (/429|Too Many Requests/i.test(raw)) return "Le réseau Solana (RPC) est momentanément saturé. Réessayez dans quelques secondes.";
  if (/fetch failed|Failed to fetch|NetworkError|ECONN|timeout|timed out|503|502/i.test(raw)) return "Impossible de joindre le réseau Solana (RPC). Vérifiez votre connexion puis réessayez.";
  return raw || "Erreur inconnue";
}

export function showError(e: unknown) {
  const msg = friendlyMessage(e);
  let html = esc(msg);
  if (e instanceof ConfirmationError) html += ` — <a href="https://solscan.io/tx/${esc(e.signature)}" target="_blank" rel="noopener noreferrer">voir sur Solscan ↗</a>`;
  if (e instanceof SimulationError && DEBUG) {
    html += `<details open><summary>DIAGNOSTIC</summary><pre>${esc(JSON.stringify({ err: e.err, unitsConsumed: e.unitsConsumed }, null, 2))}\n\n${esc(e.logs.join("\n"))}</pre></details>`;
  }
  setStatus("err", html);
}

export function showSuccess(label: string, sig: string) {
  setStatus("ok", `${esc(label)} confirmé. <a href="https://solscan.io/tx/${esc(sig)}" target="_blank" rel="noopener noreferrer">Voir la transaction sur Solscan ↗</a>`);
}

/** Bouton wallet + modale (sélection Phantom / Solflare, ou gestion du wallet connecté). */
export function mountWallet() {
  const btn = $<HTMLButtonElement>("walletBtn"), modal = $("walletModal"), list = $("wmList"), title = $("wmTitle");
  let lastFocus: HTMLElement | null = null;
  modal.setAttribute("aria-hidden", "true");
  const close = () => { modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true"); lastFocus?.focus(); };
  const open = () => {
    lastFocus = document.activeElement as HTMLElement | null;
    modal.classList.add("open"); modal.setAttribute("aria-hidden", "false");
    (list.querySelector("button, a") as HTMLElement | null)?.focus();
  };
  $("wmClose").addEventListener("click", close);
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
  document.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("open")) return;
    if (e.key === "Escape") close();
    if (e.key === "Tab") { // piège de focus minimal dans la modale
      const f = Array.from(modal.querySelectorAll<HTMLElement>("button, a[href]"));
      const first = f[0], last = f[f.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  const option = (html: string, onClick: () => void, cls = "wm__opt") => {
    const b = document.createElement("button"); b.className = cls; b.type = "button"; b.innerHTML = html; b.addEventListener("click", onClick); list.appendChild(b); return b;
  };
  const renderChoose = () => {
    title.textContent = "Connecter un wallet"; list.innerHTML = "";
    for (const w of walletList()) {
      const b = option(`<b>${w.id}</b><small>${w.installed ? "Détecté" : "Installer ↗"}</small>`, async () => {
        if (!w.installed) { window.open(w.url, "_blank", "noopener,noreferrer"); return; }
        b.disabled = true; b.querySelector("small")!.textContent = "Connexion…";
        try { await connect(w.id as WalletId); close(); }
        catch (e) { b.disabled = false; b.querySelector("small")!.textContent = "Détecté"; toast(/reject|refus|annul|cancel|denied/i.test((e as Error)?.message || "") ? "Connexion refusée dans le wallet" : "Connexion impossible : " + ((e as Error).message || "réessayez")); }
      });
    }
  };
  const renderAccount = () => {
    const pk = publicKey(); if (!pk) return renderChoose();
    const addr = pk.toBase58();
    title.textContent = `${currentWallet() ?? "Wallet"} connecté`; list.innerHTML = "";
    option(`<b class="mono" style="font-size:13px">${short(addr)}</b><small>Copier l'adresse</small>`, async () => {
      try { await navigator.clipboard.writeText(addr); toast("Adresse copiée"); } catch { toast(addr); }
    });
    const a = document.createElement("a"); a.className = "wm__opt"; a.href = `https://solscan.io/account/${addr}`; a.target = "_blank"; a.rel = "noopener noreferrer";
    a.innerHTML = `<b>Voir sur Solscan</b><small>↗</small>`; list.appendChild(a);
    option(`<b>Déconnecter</b><small>Action explicite</small>`, async () => { await disconnect(); close(); toast("Wallet déconnecté"); });
  };

  onWallet((pk, name, status) => {
    btn.disabled = status === "restoring";
    btn.removeAttribute("aria-busy");
    if (pk) {
      btn.classList.remove("btn--primary");
      btn.innerHTML = `<span class="wbtn__dot" aria-hidden="true"></span><span class="wbtn__addr">${short(pk.toBase58())}</span>`;
      btn.title = `${name} connecté — gérer le wallet`; btn.setAttribute("aria-label", `Wallet ${name} connecté, adresse ${short(pk.toBase58())}. Ouvrir les options.`);
    } else if (status === "restoring") {
      btn.classList.add("btn--primary"); btn.textContent = "Reconnexion…"; btn.setAttribute("aria-busy", "true"); btn.title = ""; btn.setAttribute("aria-label", "Reconnexion du wallet en cours");
    } else {
      btn.classList.add("btn--primary"); btn.textContent = "Connecter wallet"; btn.title = ""; btn.setAttribute("aria-label", "Connecter un wallet");
    }
    if (modal.classList.contains("open")) (pk ? renderAccount : renderChoose)();
  });
  btn.addEventListener("click", () => { (publicKey() ? renderAccount : renderChoose)(); open(); });
  void autoConnect();
}
