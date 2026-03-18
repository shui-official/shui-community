import React, { useEffect, useMemo, useState } from "react";

type LedgerTypeFilter = "" | "immediate" | "vesting";
type LedgerStatusFilter = "" | "pending" | "exported" | "sent" | "blocked" | "completed";

type LedgerEntry = {
  id: string;
  wallet: string;
  walletNormalized: string;
  entryType: "immediate" | "vesting";
  sourcePeriod: string;
  payablePeriod: string;
  amountPlanned: number;
  amountSent: number;
  status: "pending" | "exported" | "sent" | "blocked" | "completed";
  blockReason: string | null;
};

type LedgerResponse = {
  ok: boolean;
  error?: string;
  period?: string;
  filters?: {
    type: LedgerTypeFilter | null;
    status: LedgerStatusFilter | null;
  };
  counts?: {
    total: number;
    immediate: number;
    vesting: number;
    pending: number;
    blocked: number;
  };
  totals?: {
    plannedShui: number;
    sentShui: number;
    immediatePlannedShui: number;
    vestingPlannedShui: number;
  };
  entries?: LedgerEntry[];
};

type MarkSentResponse = {
  ok: boolean;
  error?: string;
  updatedCount?: number;
  skippedCount?: number;
};

function formatNumber(value: number | undefined) {
  if (typeof value !== "number") return "—";
  return value.toLocaleString("fr-FR");
}

function shortWallet(wallet: string) {
  if (!wallet) return "—";
  return `${wallet.slice(0, 4)}…${wallet.slice(-4)}`;
}

function badgeClass(status: LedgerEntry["status"]) {
  switch (status) {
    case "completed":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
    case "pending":
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";
    case "blocked":
      return "border-rose-400/20 bg-rose-400/10 text-rose-300";
    case "sent":
      return "border-violet-400/20 bg-violet-400/10 text-violet-300";
    case "exported":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";
    default:
      return "border-white/10 bg-white/5 text-white";
  }
}

export default function RewardsLedgerTable() {
  const [data, setData] = useState<LedgerResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [typeFilter, setTypeFilter] = useState<LedgerTypeFilter>("");
  const [statusFilter, setStatusFilter] = useState<LedgerStatusFilter>("");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [csvBatchId, setCsvBatchId] = useState("");
  const [txRef, setTxRef] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  async function loadLedger(nextType = typeFilter, nextStatus = statusFilter) {
    setLoading(true);
    setActionMessage("");

    try {
      const params = new URLSearchParams();
      if (nextType) params.set("type", nextType);
      if (nextStatus) params.set("status", nextStatus);

      const query = params.toString();
      const res = await fetch(`/api/rewards/ledger${query ? `?${query}` : ""}`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      const json = (await res.json()) as LedgerResponse;
      setData(json);
    } catch {
      setData({ ok: false, error: "network_error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLedger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entries = data?.entries ?? [];

  const pendingSelectableIds = useMemo(
    () => entries.filter((entry) => entry.status === "pending").map((entry) => entry.id),
    [entries]
  );

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => pendingSelectableIds.includes(id)));
  }, [pendingSelectableIds]);

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  async function markSelectedAsSent() {
    if (selectedIds.length === 0) {
      setActionMessage("Aucune ligne pending sélectionnée.");
      return;
    }

    setActionLoading(true);
    setActionMessage("");

    try {
      const res = await fetch("/api/rewards/mark-sent", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          entryIds: selectedIds,
          sentAt: Date.now(),
          csvBatchId: csvBatchId.trim() || null,
          txRef: txRef.trim() || null,
        }),
      });

      const json = (await res.json()) as MarkSentResponse;

      if (!res.ok || !json?.ok) {
        setActionMessage(`Erreur mark-sent${json?.error ? ` (${json.error})` : ""}`);
        return;
      }

      setActionMessage(
        `Lignes mises à jour ✅ — updated: ${json.updatedCount ?? 0}, skipped: ${json.skippedCount ?? 0}`
      );
      setSelectedIds([]);
      await loadLedger(typeFilter, statusFilter);
    } catch {
      setActionMessage("Erreur réseau pendant le marquage envoyé.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-cyan-300/70">
            Ledger Admin
          </div>
          <h3 className="mt-2 text-xl font-semibold text-white">
            Distribution ledger
          </h3>
          <p className="mt-1 text-sm text-white/65">
            Lignes de distribution immédiate et vesting pour la période courante.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => loadLedger(typeFilter, statusFilter)}
            className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/15"
          >
            {loading ? "Refresh..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs text-white/50">Total lignes</div>
          <div className="mt-2 text-lg font-semibold text-white">
            {formatNumber(data?.counts?.total)}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs text-white/50">Immediate</div>
          <div className="mt-2 text-lg font-semibold text-white">
            {formatNumber(data?.counts?.immediate)}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs text-white/50">Vesting</div>
          <div className="mt-2 text-lg font-semibold text-white">
            {formatNumber(data?.counts?.vesting)}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs text-white/50">Planned SHUI</div>
          <div className="mt-2 text-lg font-semibold text-white">
            {formatNumber(data?.totals?.plannedShui)}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-xs text-white/50">Filtre type</div>
          <select
            value={typeFilter}
            onChange={(e) => {
              const next = e.target.value as LedgerTypeFilter;
              setTypeFilter(next);
              loadLedger(next, statusFilter);
            }}
            className="mt-2 w-full bg-transparent text-sm font-medium text-white outline-none"
          >
            <option value="" className="bg-slate-900">Tous</option>
            <option value="immediate" className="bg-slate-900">Immediate</option>
            <option value="vesting" className="bg-slate-900">Vesting</option>
          </select>
        </label>

        <label className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-xs text-white/50">Filtre statut</div>
          <select
            value={statusFilter}
            onChange={(e) => {
              const next = e.target.value as LedgerStatusFilter;
              setStatusFilter(next);
              loadLedger(typeFilter, next);
            }}
            className="mt-2 w-full bg-transparent text-sm font-medium text-white outline-none"
          >
            <option value="" className="bg-slate-900">Tous</option>
            <option value="pending" className="bg-slate-900">Pending</option>
            <option value="completed" className="bg-slate-900">Completed</option>
            <option value="blocked" className="bg-slate-900">Blocked</option>
            <option value="exported" className="bg-slate-900">Exported</option>
            <option value="sent" className="bg-slate-900">Sent</option>
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <label className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-xs text-white/50">csvBatchId (optionnel)</div>
          <input
            value={csvBatchId}
            onChange={(e) => setCsvBatchId(e.target.value)}
            placeholder="ex: multisender-2026-03-a"
            className="mt-2 w-full bg-transparent text-sm font-medium text-white outline-none placeholder:text-white/30"
          />
        </label>

        <label className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-xs text-white/50">txRef (optionnel)</div>
          <input
            value={txRef}
            onChange={(e) => setTxRef(e.target.value)}
            placeholder="ex: solscan tx / note admin"
            className="mt-2 w-full bg-transparent text-sm font-medium text-white outline-none placeholder:text-white/30"
          />
        </label>

        <button
          type="button"
          onClick={markSelectedAsSent}
          disabled={actionLoading}
          className={[
            "rounded-xl px-4 py-3 text-sm font-semibold text-white",
            actionLoading
              ? "cursor-not-allowed border border-emerald-400/10 bg-emerald-400/10 opacity-70"
              : "border border-emerald-400/20 bg-emerald-400/15 hover:bg-emerald-400/20",
          ].join(" ")}
        >
          {actionLoading ? "Marking..." : "Mark selected as sent"}
        </button>
      </div>

      {actionMessage ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/75">
          {actionMessage}
        </div>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
        {loading ? (
          <div className="p-4 text-sm text-white/70">Chargement…</div>
        ) : !data?.ok ? (
          <div className="p-4 text-sm text-rose-300">
            Ledger indisponible {data?.error ? `(${data.error})` : ""}
          </div>
        ) : entries.length === 0 ? (
          <div className="p-6 text-sm text-white/65">
            Aucune ligne ledger pour cette période / ce filtre.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-white/80">
              <thead className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-[0.16em] text-white/45">
                <tr>
                  <th className="px-4 py-3">Pick</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Wallet</th>
                  <th className="px-4 py-3">Montant</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Payable</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const selectable = entry.status === "pending";
                  const checked = selectedIds.includes(entry.id);

                  return (
                    <tr key={entry.id} className="border-b border-white/5 last:border-b-0">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!selectable}
                          onChange={() => toggleSelected(entry.id)}
                          className="h-4 w-4 accent-cyan-400"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80">
                          {entry.entryType}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-white">
                        {shortWallet(entry.wallet)}
                      </td>
                      <td className="px-4 py-3">{formatNumber(entry.amountPlanned)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-lg border px-2 py-1 text-xs ${badgeClass(entry.status)}`}>
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/65">{entry.sourcePeriod}</td>
                      <td className="px-4 py-3 text-white/65">{entry.payablePeriod}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
