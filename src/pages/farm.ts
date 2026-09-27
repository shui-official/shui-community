import { $, mountWallet, setStatus, statusText, showError, showSuccess, short } from "../ui/common";
import { onWallet, publicKey, signer } from "../lib/wallet/wallet";
import { getConnection } from "../lib/solana/connection";
import { COMPUTE, RAYDIUM_CPMM, RAYDIUM_FARM, TOKENS } from "../lib/solana/constants";
import { formatUnits, parseUnits } from "../lib/solana/amounts";
import { solBalance } from "../lib/solana/balances";
import { fetchFarm, fetchPosition, buildFarmTx, computePending, type FarmAction, type FarmState, type UserPosition } from "../lib/farm/farm";
import { estimateNetworkFeeLamports } from "../lib/transactions/compile";
import { prepare, execute } from "../lib/transactions/pipeline";
import { ValidationError } from "../lib/transactions/errors";
import { farmExpectations } from "../lib/transactions/expectations";

mountWallet();
const conn = getConnection();
const LPD = TOKENS.LP.decimals, SD = TOKENS.SHUI.decimals;
const input = $<HTMLInputElement>("lpAmount"), action = $<HTMLButtonElement>("actionBtn");
let tab: FarmAction = "deposit"; let farm: FarmState | null = null; let pos: UserPosition | null = null; let sol: bigint | null = null; let busy = false;

($("addLiq") as HTMLAnchorElement).href = `https://raydium.io/liquidity/increase/?mode=add&pool_id=${RAYDIUM_CPMM.poolId.toBase58()}`;
$("rFarm").textContent = `Raydium v6 · ${short(RAYDIUM_FARM.farmId.toBase58())}`;
$("rNet").textContent = `~${formatUnits(estimateNetworkFeeLamports(COMPUTE.farmUnits), 9)} SOL`;

const fmtDate = (t: number) => new Date(t * 1000).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });

async function loadFarm() {
  try {
    farm = await fetchFarm(conn);
    const r = farm.rewards[0];
    const now = Math.floor(Date.now() / 1000);
    const live = r && now >= r.openTime && now < r.endTime;
    const st = $("farmState"); st.textContent = !r ? "—" : now < r.openTime ? "À venir" : live ? "Active" : "Terminée"; st.className = "pill" + (live ? " pill--live" : "");
    $("farmInfo").innerHTML = r ? [
      ["Farm ID", short(RAYDIUM_FARM.farmId.toBase58())],
      ["Récompense", "SHUI"],
      ["Début", fmtDate(r.openTime)],
      ["Fin", fmtDate(r.endTime)],
      ["LP total en Farm", formatUnits(farm.totalStaked, LPD, 4)],
      ["Émission / semaine", formatUnits(r.perSecond * 604800n, SD, 2) + " SHUI"],
    ].map(([k, v]) => `<div><span>${k}</span><span>${v}</span></div>`).join("") + `<div><span>Vérifier</span><span><a href="https://solscan.io/account/${RAYDIUM_FARM.farmId.toBase58()}" target="_blank" rel="noopener noreferrer" style="color:var(--aqua)">Solscan ↗</a></span></div>` : "";
  } catch (e) { $("farmInfo").innerHTML = `<div><span>Farm</span><span>RPC indisponible</span></div>`; showError(e); }
}

async function loadPosition() {
  const pk = publicKey();
  if (!pk || !farm) { pos = null; sol = null; paint(); return; }
  if (!pos) for (const id of ["pWallet", "pStaked", "pPending"]) $(id).textContent = "Chargement…";
  try { [pos, sol] = await Promise.all([fetchPosition(conn, pk, farm), solBalance(conn, pk)]); }
  catch (e) { pos = null; showError(e); setTimeout(() => { if (publicKey()) void loadPosition(); }, 8000); }
  paint();
}

function paint() {
  $("pWallet").innerHTML = pos ? `${formatUnits(pos.walletLp, LPD, 4)}<small>LP</small>` : "—";
  $("pStaked").innerHTML = pos ? `${formatUnits(pos.deposited, LPD, 4)}<small>LP</small>` : "—";
  $("pPending").innerHTML = pos ? `${formatUnits(pos.pending[0] ?? 0n, SD, 4)}<small>SHUI</small>` : "—";
  const avail = !pos ? null : tab === "deposit" ? pos.walletLp : pos.deposited;
  $("lpAvail").textContent = avail === null ? "—" : formatUnits(avail, LPD, 4);
  $("lpLabel").textContent = tab === "deposit" ? "LP à déposer" : "LP à retirer";
  ($("lpField") as HTMLElement).style.display = tab === "claim" ? "none" : "";
  $("rAction").textContent = tab === "deposit" ? "Déposer des LP" : tab === "withdraw" ? "Retirer des LP" : "Réclamer les SHUI";
  $("rHarvest").textContent = pos ? `${formatUnits(pos.pending[0] ?? 0n, SD, 6)} SHUI (estimation on-chain)` : "—";
  let amt: bigint | null = null;
  try { amt = tab === "claim" ? 0n : input.value.trim() ? parseUnits(input.value, LPD) : null; $("rAmount").textContent = tab === "claim" ? "0 LP" : amt !== null ? `${formatUnits(amt, LPD)} LP` : "—"; }
  catch (e) { $("rAmount").textContent = "—"; statusText("err", (e as Error).message); }
  updateAction(amt);
}

function problem(amt: bigint | null): string | null {
  if (!farm) return "Données Farm indisponibles";
  if (!pos) return "Chargement de la position…";
  if (sol !== null && sol < estimateNetworkFeeLamports(COMPUTE.farmUnits) + 2_100_000n) return "SOL insuffisant pour les frais réseau";
  if (tab === "claim") return pos.deposited === 0n ? "Aucune position dans la Farm" : null;
  if (amt === null || amt <= 0n) return "Saisir un montant";
  if (tab === "deposit" && amt > pos.walletLp) return "LP insuffisants dans le wallet";
  if (tab === "withdraw" && amt > pos.deposited) return "LP insuffisants dans la Farm";
  return null;
}

function updateAction(amt: bigint | null) {
  if (busy) return;
  if (!publicKey()) { action.disabled = false; action.textContent = "Connecter un wallet"; action.dataset.mode = "connect"; return; }
  const p = problem(amt);
  if (p) { action.disabled = true; action.textContent = p; action.dataset.mode = ""; return; }
  action.disabled = false; action.dataset.mode = "go";
  action.textContent = tab === "deposit" ? "Déposer dans la Farm" : tab === "withdraw" ? "Retirer de la Farm" : "Réclamer mes SHUI";
}

document.querySelectorAll<HTMLButtonElement>(".tabs button").forEach((b) => b.addEventListener("click", () => {
  tab = b.dataset.tab as FarmAction; input.value = ""; setStatus("hide");
  document.querySelectorAll(".tabs button").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
  paint();
}));
input.addEventListener("input", () => { setStatus("hide"); paint(); });
$("maxBtn").addEventListener("click", () => { if (!pos) return; const v = tab === "deposit" ? pos.walletLp : pos.deposited; input.value = formatUnits(v, LPD).replace(/\s/g, ""); paint(); });

action.addEventListener("click", async () => {
  if (action.dataset.mode === "connect") { $("walletBtn").click(); return; }
  if (action.dataset.mode !== "go") return;
  const pk = publicKey(); if (!pk || !pos) return;
  let amt: bigint; try { amt = tab === "claim" ? 0n : parseUnits(input.value, LPD); } catch (e) { showError(e); return; }
  const p = problem(amt); if (p) { showError(new ValidationError(p)); return; }
  busy = true; action.disabled = true;
  try {
    action.textContent = "Simulation…"; statusText("info", "Construction et simulation de la transaction Farm…");
    const current = pos;
    const prepared = await prepare(conn, () => buildFarmTx(conn, pk, tab, amt, current), farmExpectations(pk));
    statusText("info", `Simulation OK (${prepared.simulation.unitsConsumed ?? "?"} CU). Confirmez dans votre wallet.`);
    action.textContent = "Signature dans le wallet…";
    const sig = await execute(conn, prepared, signer());
    showSuccess(tab === "deposit" ? "Dépôt" : tab === "withdraw" ? "Retrait" : "Réclamation", sig);
    input.value = "";
  } catch (e) { showError(e); }
  finally { busy = false; await loadFarm(); await loadPosition(); }
});

// rafraîchit l'estimation des rewards chaque seconde à partir de l'état on-chain (sans appel réseau)
setInterval(() => {
  if (!farm || !pos || pos.deposited === 0n) return;
  pos = { ...pos, pending: computePending(farm, pos.deposited, pos.rewardDebts, Math.floor(Date.now() / 1000)) };
  $("pPending").innerHTML = `${formatUnits(pos.pending[0] ?? 0n, SD, 4)}<small>SHUI</small>`;
}, 1000);
setInterval(() => { void loadFarm().then(loadPosition); }, 45_000);

onWallet(() => { void loadPosition(); });
paint();
void loadFarm().then(loadPosition);
