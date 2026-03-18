import React, { useEffect, useMemo, useState } from "react";

type AdminSummaryResponse = {
  ok: boolean;
  error?: string;
  period?: string;
  batch?: {
    id: string;
    status: string;
    executionDate: string;
    snapshotCount: number;
    immediateLedgerCount: number;
    vestingInstallmentCount: number;
    errorsCount: number;
    updatedAt: number;
  } | null;
  state?: {
    hasBatch: boolean;
    hasSnapshots: boolean;
    hasLedger: boolean;
    isEmpty: boolean;
  };
  counts?: {
    snapshots: number;
    validSnapshots: number;
    blockedSnapshots: number;
    vestingSchedules: number;
    vestingInstallments: number;
    ledgerTotal: number;
    ledgerImmediate: number;
    ledgerVesting: number;
    ledgerPending: number;
    ledgerBlocked: number;
    ledgerCompleted: number;
  };
  totals?: {
    snapshotTotalShui: number;
    snapshotImmediateShui: number;
    snapshotVestingShui: number;
    ledgerPlannedShui: number;
    ledgerSentShui: number;
    ledgerImmediatePlannedShui: number;
    ledgerVestingPlannedShui: number;
    ledgerPendingShui: number;
    ledgerBlockedShui: number;
    ledgerCompletedShui: number;
  };
};

type RunMonthlyResponse = {
  ok: boolean;
  error?: string;
  saved?: boolean;
  period?: string;
  snapshotDate?: string;
  conversionRatio?: number;
  counts?: {
    snapshots: number;
    walletValidations: number;
    blockedWallets: number;
    vestingSchedules: number;
    vestingInstallments: number;
    immediateLedgerEntries: number;
    vestingLedgerEntries: number;
    totalLedgerEntries: number;
  };
};

function formatNumber(value: number | undefined) {
  if (typeof value !== "number") return "—";
  return value.toLocaleString("fr-FR");
}

function openInNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function getCurrentPeriod() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export default function RewardsMonthlyOverview() {
  const [data, setData] = useState<AdminSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [periodInput, setPeriodInput] = useState(getCurrentPeriod());
  const [conversionRatio, setConversionRatio] = useState("10");

  const [runLoading, setRunLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string>("");

  async function loadSummary(targetPeriod?: string) {
    setLoading(true);
    setActionMessage("");

    try {
      const period = targetPeriod || periodInput;
      const res = await fetch(`/api/rewards/admin-summary?period=${encodeURIComponent(period)}`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      const json = (await res.json()) as AdminSummaryResponse;
      setData(json);

      if (json?.period) {
        setPeriodInput(json.period);
      }
    } catch {
      setData({ ok: false, error: "network_error" });
    } finally {
      setLoading(false);
    }
  }

  async function runMonthlyBatch() {
    setRunLoading(true);
    setActionMessage("");

    try {
      const ratio = Number(conversionRatio);

      const res = await fetch("/api/rewards/monthly/run", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          period: periodInput,
          conversionRatio: ratio,
          force: true,
        }),
      });

      const json = (await res.json()) as RunMonthlyResponse;

      if (!res.ok || !json?.ok) {
        setActionMessage(`Erreur run monthly${json?.error ? ` (${json.error})` : ""}`);
        return;
      }

      setActionMessage(
        `Batch régénéré ✅ — snapshots: ${json.counts?.snapshots ?? 0}, ledger: ${json.counts?.totalLedgerEntries ?? 0}`
      );

      await loadSummary(periodInput);
    } catch {
      setActionMessage("Erreur réseau pendant le run monthly.");
    } finally {
      setRunLoading(false);
    }
  }

  useEffect(() => {
    loadSummary(periodInput);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const period = useMemo(() => data?.period ?? periodInput ?? "—", [data?.period, periodInput]);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-cyan-300/70">
            Rewards Admin
          </div>
          <h3 className="mt-2 text-xl font-semibold text-white">
            Suivi mensuel Rewards / Vesting
          </h3>
          <p className="mt-1 text-sm text-white/65">
            Vue synthétique du mois courant pour le batch, les snapshots, le vesting et le ledger.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => loadSummary(periodInput)}
            className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/15"
          >
            {loading ? "Refresh..." : "Refresh"}
          </button>

          <button
            type="button"
            onClick={() => openInNewTab(`/api/rewards/admin-summary?period=${encodeURIComponent(period)}`)}
            className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/15"
          >
            Voir résumé JSON
          </button>

          <button
            type="button"
            onClick={() => openInNewTab(`/api/rewards/export/immediate?period=${encodeURIComponent(period)}`)}
            className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/15"
          >
            CSV immédiat
          </button>

          <button
            type="button"
            onClick={() => openInNewTab(`/api/rewards/export/vesting?period=${encodeURIComponent(period)}`)}
            className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/15"
          >
            CSV vesting
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1.2fr_0.8fr_0.8fr_auto]">
        <label className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-xs text-white/50">Période</div>
          <input
            value={periodInput}
            onChange={(e) => setPeriodInput(e.target.value)}
            placeholder="YYYY-MM"
            className="mt-2 w-full bg-transparent text-sm font-medium text-white outline-none placeholder:text-white/30"
          />
        </label>

        <label className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-xs text-white/50">Conversion ratio</div>
          <input
            value={conversionRatio}
            onChange={(e) => setConversionRatio(e.target.value)}
            inputMode="decimal"
            className="mt-2 w-full bg-transparent text-sm font-medium text-white outline-none placeholder:text-white/30"
          />
        </label>

        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-xs text-white/50">Batch courant</div>
          <div className="mt-2 text-sm font-medium text-white">{data?.batch?.status ?? "Aucun"}</div>
        </div>

        <button
          type="button"
          onClick={runMonthlyBatch}
          disabled={runLoading}
          className={[
            "rounded-xl px-4 py-3 text-sm font-semibold text-white",
            runLoading
              ? "cursor-not-allowed border border-cyan-400/10 bg-cyan-400/10 opacity-70"
              : "border border-cyan-400/20 bg-cyan-400/15 hover:bg-cyan-400/20",
          ].join(" ")}
        >
          {runLoading ? "Run..." : "Run monthly batch"}
        </button>
      </div>

      {actionMessage ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/75">
          {actionMessage}
        </div>
      ) : null}

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
        {loading ? (
          <div className="text-sm text-white/70">Chargement…</div>
        ) : !data?.ok ? (
          <div className="text-sm text-red-300/90">
            Résumé indisponible {data?.error ? `(${data.error})` : ""}
          </div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-white/50">Période</div>
                <div className="mt-2 text-lg font-semibold text-white">{period}</div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-white/50">Batch</div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {data.batch?.status ?? "Aucun"}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-white/50">Snapshots</div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {formatNumber(data.counts?.snapshots)}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-white/50">Ledger total</div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {formatNumber(data.counts?.ledgerTotal)}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-4">
                <div className="text-xs text-white/50">SHUI total snapshot</div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {formatNumber(data.totals?.snapshotTotalShui)}
                </div>
              </div>

              <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/5 p-4">
                <div className="text-xs text-white/50">SHUI immédiat</div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {formatNumber(data.totals?.snapshotImmediateShui)}
                </div>
              </div>

              <div className="rounded-xl border border-fuchsia-400/10 bg-fuchsia-400/5 p-4">
                <div className="text-xs text-white/50">SHUI vesting</div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {formatNumber(data.totals?.snapshotVestingShui)}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-white/50">Vesting schedules</div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {formatNumber(data.counts?.vestingSchedules)}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-white/50">Installments</div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {formatNumber(data.counts?.vestingInstallments)}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-white/50">Ledger pending</div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {formatNumber(data.counts?.ledgerPending)}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-white/50">Ledger completed</div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {formatNumber(data.counts?.ledgerCompleted)}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/65">
              <div>
                <span className="font-medium text-white/90">État :</span>{" "}
                {data.state?.isEmpty
                  ? "aucune donnée"
                  : data.state?.hasBatch
                    ? "batch présent"
                    : "en attente"}
              </div>
              <div className="mt-2">
                <span className="font-medium text-white/90">Ledger planned :</span>{" "}
                {formatNumber(data.totals?.ledgerPlannedShui)} SHUI
              </div>
              <div className="mt-1">
                <span className="font-medium text-white/90">Ledger sent :</span>{" "}
                {formatNumber(data.totals?.ledgerSentShui)} SHUI
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
