import { $, mountWallet, setStatus, statusText, showError, showSuccess, short } from "../ui/common";
import { onWallet, publicKey, signer } from "../lib/wallet/wallet";
import { getConnection } from "../lib/solana/connection";
import { SLIPPAGE, SOL_FEE_RESERVE_LAMPORTS, TOKENS, COMPUTE, routeFor, type TokenSymbol } from "../lib/solana/constants";
import { formatUnits, parseUnits, AmountError } from "../lib/solana/amounts";
import { solBalance, splBalance } from "../lib/solana/balances";
import { quoteRaydium, buildRaydiumSwap, type SwapQuote } from "../lib/raydium/cpmm";
import { quoteOrca, buildOrcaSwap } from "../lib/orca/whirlpool";
import { estimateNetworkFeeLamports } from "../lib/transactions/compile";
import { prepare, execute, type Prepared } from "../lib/transactions/pipeline";
import { ValidationError } from "../lib/transactions/errors";
import { swapExpectations } from "../lib/transactions/expectations";

mountWallet();
const conn = getConnection();
const tokIn = $<HTMLSelectElement>("tokIn"), tokOut = $<HTMLSelectElement>("tokOut");
const amountIn = $<HTMLInputElement>("amountIn"), action = $<HTMLButtonElement>("actionBtn");
let slipBps: number = SLIPPAGE.defaultBps;
const balances: Partial<Record<TokenSymbol, bigint>> = {};
let quote: SwapQuote | null = null; let quoteSeq = 0; let busy = false;

// Slippage
const seg = $("slipSeg");
for (const bps of SLIPPAGE.options) {
  const b = document.createElement("button"); b.type = "button"; b.textContent = (bps / 100).toString().replace(".", ",") + " %";
  b.setAttribute("aria-pressed", String(bps === slipBps));
  b.addEventListener("click", () => { slipBps = bps; seg.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); void refreshQuote(); });
  seg.appendChild(b);
}

const sym = (s: string) => s as TokenSymbol;
const dec = (s: TokenSymbol) => TOKENS[s].decimals;

function fixPair(changed: "in" | "out") {
  const a = sym(tokIn.value), b = sym(tokOut.value);
  if (a === b || !routeFor(a, b)) {
    if (changed === "in") tokOut.value = a === "SHUI" ? "SOL" : "SHUI";
    else tokIn.value = b === "SHUI" ? "SOL" : "SHUI";
  }
}
tokIn.addEventListener("change", () => { fixPair("in"); void refreshAll(); });
tokOut.addEventListener("change", () => { fixPair("out"); void refreshAll(); });
$("flipBtn").addEventListener("click", () => { const a = tokIn.value; tokIn.value = tokOut.value; tokOut.value = a; amountIn.value = ""; void refreshAll(); });
let deb: number | undefined;
amountIn.addEventListener("input", () => { clearTimeout(deb); deb = window.setTimeout(() => void refreshQuote(), 350); });
$("maxBtn").addEventListener("click", () => {
  const s = sym(tokIn.value); let b = balances[s]; if (b === undefined) return;
  if (s === "SOL") b = b > SOL_FEE_RESERVE_LAMPORTS ? b - SOL_FEE_RESERVE_LAMPORTS : 0n;
  amountIn.value = formatUnits(b, dec(s)).replace(/\s/g, ""); void refreshQuote();
});

async function refreshBalances() {
  const pk = publicKey();
  const wb = $("walletBal");
  if (!pk) { for (const k of Object.keys(balances)) delete balances[k as TokenSymbol]; wb.innerHTML = `<div><span>État</span><span>Non connecté</span></div>`; paintBal(); return; }
  wb.setAttribute("aria-busy", "true");
  if (balances.SOL === undefined) wb.innerHTML = `<div><span>Adresse</span><span>${short(pk.toBase58())}</span></div><div><span>Soldes</span><span>Chargement…</span></div>`;
  try {
    const [sol, shui, usdc] = await Promise.all([solBalance(conn, pk), splBalance(conn, pk, TOKENS.SHUI.mint), splBalance(conn, pk, TOKENS.USDC.mint)]);
    Object.assign(balances, { SOL: sol, SHUI: shui, USDC: usdc });
    wb.innerHTML = `<div><span>Adresse</span><span>${short(pk.toBase58())}</span></div>` +
      (["SOL", "SHUI", "USDC"] as TokenSymbol[]).map((s) => `<div><span>${s}</span><span>${formatUnits(balances[s] ?? 0n, dec(s), s === "USDC" ? 2 : 4)}</span></div>`).join("");
  } catch (e) { wb.innerHTML = `<div><span>Adresse</span><span>${short(pk.toBase58())}</span></div><div><span>Soldes</span><span>RPC indisponible — réessai automatique</span></div>`; console.warn("[SHUI] soldes", (e as Error)?.message); setTimeout(() => { if (publicKey()) void refreshBalances().then(updateAction); }, 8000); }
  wb.removeAttribute("aria-busy");
  paintBal();
}
function paintBal() {
  const a = sym(tokIn.value), b = sym(tokOut.value);
  $("balIn").textContent = balances[a] !== undefined ? formatUnits(balances[a] as bigint, dec(a), 4) : "—";
  $("balOut").textContent = balances[b] !== undefined ? formatUnits(balances[b] as bigint, dec(b), 4) : "—";
}

function clearRecap() {
  for (const id of ["rIn", "rOut", "rMin", "rSlip", "rFee", "rImpact", "rNet", "rPool"]) $(id).textContent = "—";
  const o = $("amountOut"); o.textContent = "0"; o.classList.add("is-empty");
}

function validateAmount(): bigint | null {
  const a = sym(tokIn.value);
  if (!amountIn.value.trim()) return null;
  const raw = parseUnits(amountIn.value, dec(a));
  if (raw <= 0n) throw new AmountError("Montant nul");
  return raw;
}

function balanceProblem(raw: bigint): string | null {
  const a = sym(tokIn.value); const pk = publicKey(); if (!pk) return null;
  const bal = balances[a]; const sol = balances.SOL;
  if (bal === undefined || sol === undefined) return null;
  const fee = estimateNetworkFeeLamports(COMPUTE.swapUnits);
  if (a === "SOL") { if (raw + SOL_FEE_RESERVE_LAMPORTS > bal) return "SOL insuffisant (conservez ~0,01 SOL pour les frais)"; }
  else {
    if (raw > bal) return `${a} insuffisant`;
    if (sol < fee + 2_100_000n) return "SOL insuffisant pour les frais réseau et la création éventuelle du compte token";
  }
  return null;
}

async function refreshQuote() {
  const seq = ++quoteSeq; quote = null; setStatus("hide");
  const a = sym(tokIn.value), b = sym(tokOut.value); const route = routeFor(a, b);
  $("routePill").textContent = route ? route.protocol : "—";
  let raw: bigint | null;
  try { raw = validateAmount(); } catch (e) { clearRecap(); statusText("err", (e as Error).message); return updateAction(); }
  if (!raw || !route) { clearRecap(); return updateAction(); }
  const owner = publicKey() ?? TOKENS.SHUI.mint; // quote en lecture seule possible sans wallet
  $("amountOut").textContent = "…"; $("recap").setAttribute("aria-busy", "true");
  try {
    const q = route.protocol === "Raydium CPMM"
      ? await quoteRaydium(conn, owner, TOKENS[a].mint, TOKENS[b].mint, raw, slipBps)
      : await quoteOrca(conn, owner, TOKENS[a].mint, TOKENS[b].mint, raw, slipBps);
    if (seq !== quoteSeq) return;
    quote = q;
    const o = $("amountOut"); o.textContent = formatUnits(q.estimatedOut, dec(b), 6); o.classList.remove("is-empty");
    $("rIn").textContent = `${formatUnits(q.amountIn, dec(a))} ${a}`;
    $("rOut").textContent = `${formatUnits(q.estimatedOut, dec(b))} ${b}`;
    $("rMin").textContent = `${formatUnits(q.minOut, dec(b))} ${b}`;
    $("rSlip").textContent = (slipBps / 100).toString().replace(".", ",") + " %";
    $("rFee").textContent = `${formatUnits(q.poolFee, dec(a))} ${a} (${route.fee})`;
    $("rImpact").textContent = q.priceImpactPct === null ? "non fourni par le SDK" : q.priceImpactPct.toFixed(2).replace(".", ",") + " %";
    $("rNet").textContent = `~${formatUnits(estimateNetworkFeeLamports(COMPUTE.swapUnits), 9)} SOL`;
    $("rPool").textContent = `${route.protocol} · ${short(route.pool.toBase58())}`;
  } catch (e) {
    if (seq !== quoteSeq) return;
    clearRecap(); showError(e);
  }
  $("recap").removeAttribute("aria-busy");
  updateAction();
}

function updateAction() {
  const pk = publicKey();
  if (busy) return;
  if (!pk) { action.disabled = false; action.textContent = "Connecter un wallet"; action.dataset.mode = "connect"; return; }
  let raw: bigint | null = null; try { raw = validateAmount(); } catch { /* handled */ }
  if (!raw || !quote) { action.disabled = true; action.textContent = "Saisir un montant"; action.dataset.mode = ""; return; }
  const pb = balanceProblem(raw);
  if (pb) { action.disabled = true; action.textContent = pb; action.dataset.mode = ""; return; }
  action.disabled = false; action.textContent = `Échanger ${tokIn.value} → ${tokOut.value}`; action.dataset.mode = "swap";
}

action.addEventListener("click", async () => {
  if (action.dataset.mode === "connect") { $("walletBtn").click(); return; }
  if (action.dataset.mode !== "swap") return;
  const pk = publicKey(); if (!pk) return;
  const a = sym(tokIn.value), b = sym(tokOut.value); const route = routeFor(a, b); if (!route) return;
  let raw: bigint; try { raw = validateAmount() ?? 0n; } catch (e) { showError(e); return; }
  const pb = balanceProblem(raw); if (pb) { showError(new ValidationError(pb)); return; }
  busy = true; action.disabled = true;
  try {
    action.textContent = "Simulation…"; statusText("info", "Construction et simulation de la transaction…");
    const inMint = TOKENS[a].mint, outMint = TOKENS[b].mint;
    const prepared: Prepared<SwapQuote> = await prepare(conn,
      () => route.protocol === "Raydium CPMM" ? buildRaydiumSwap(conn, pk, inMint, outMint, raw, slipBps) : buildOrcaSwap(conn, pk, inMint, outMint, raw, slipBps),
      swapExpectations(route.kind, pk));
    const s = prepared.summary;
    statusText("info", `Simulation OK (${prepared.simulation.unitsConsumed ?? "?"} CU). Vérifiez dans votre wallet : ${formatUnits(s.amountIn, dec(a))} ${a} → minimum ${formatUnits(s.minOut, dec(b))} ${b}.`);
    action.textContent = "Signature dans le wallet…";
    const sig = await execute(conn, prepared, signer());
    showSuccess("Swap", sig);
    amountIn.value = "";
  } catch (e) { showError(e); }
  finally { busy = false; clearRecap(); await refreshBalances(); updateAction(); }
});

async function refreshAll() { paintBal(); await refreshQuote(); }
onWallet(() => { void refreshBalances().then(updateAction); });
// Paramètres d'URL : ?from=USDC&to=SHUI
const qs = new URLSearchParams(location.search);
const f = qs.get("from"), t = qs.get("to");
if (f && ["SOL", "USDC", "SHUI"].includes(f)) tokIn.value = f;
if (t && ["SOL", "USDC", "SHUI"].includes(t)) tokOut.value = t;
fixPair("in"); updateAction(); void refreshAll();
