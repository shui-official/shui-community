import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type RewardsStatusResponse = {
  ok: boolean;
  error?: string;
  epochId?: string;
  epochStart?: number;
  epochEnd?: number;
  poolShui?: number;
  minPoints?: number;
  myPoints?: number;
  eligibleTotalPoints?: number;
  eligible?: boolean;
  estimatedShui?: number;
  alreadyClaimed?: boolean;
  totalClaimedShui?: number;
  isAdmin?: boolean;
};

function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 9,
  }).format(Number(value || 0));
}

function formatDateRange(start?: number, end?: number): string {
  if (!start || !end) return "Période en cours";
  const formatter = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return `${formatter.format(new Date(start))} → ${formatter.format(new Date(end))}`;
}

function getEligibilityLabel(data: RewardsStatusResponse | null): string {
  if (!data) return "—";
  return data.eligible ? "Oui" : "Non";
}

function getEstimateLabel(data: RewardsStatusResponse | null): string {
  if (!data) return "—";
  if (!data.eligible) return "Non éligible pour le moment";
  return `${formatNumber(data.estimatedShui)} SHUI`;
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition-all duration-200 hover:border-white/12 hover:bg-white/[0.045]">
      <div className="text-xs uppercase tracking-[0.14em] text-white/45">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      {hint ? <div className="mt-1 text-xs text-white/45">{hint}</div> : null}
    </div>
  );
}

export default function RewardsPanel() {
  const [data, setData] = useState<RewardsStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/rewards/status", {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        const json = (await res.json()) as RewardsStatusResponse;

        if (!res.ok || !json?.ok) {
          throw new Error(json?.error || "rewards_status_unavailable");
        }

        if (!cancelled) {
          setData(json);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "rewards_status_unavailable");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleExportCsv() {
    try {
      setExporting(true);
      setExportMsg("");

      const res = await fetch("/api/rewards/export", {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        let message = "export_failed";
        try {
          const json = await res.json();
          message = json?.error || message;
        } catch {
          // ignore
        }
        throw new Error(message);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `shui-rewards-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setExportMsg("Export CSV généré ✅");
    } catch (e: any) {
      setExportMsg(`Impossible d’exporter le CSV (${e?.message || "server_error"}).`);
    } finally {
      setExporting(false);
    }
  }

  const summary = useMemo(() => {
    return {
      epochLabel: data?.epochId || "Cycle en cours",
      rangeLabel: formatDateRange(data?.epochStart, data?.epochEnd),
      pointsLabel: formatNumber(data?.myPoints),
      minPointsLabel: formatNumber(data?.minPoints),
      poolLabel: `${formatNumber(data?.poolShui)} SHUI`,
      eligibilityLabel: getEligibilityLabel(data),
      estimateLabel: getEstimateLabel(data),
      claimedLabel: data?.alreadyClaimed ? "Déjà pris en compte" : "En attente / non distribué",
    };
  }, [data]);

  return (
    <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_80px_rgba(2,12,27,0.42)] backdrop-blur-xl">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-white/50">
            Lecture mensuelle
          </div>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            Quêtes & rewards du cycle en cours
          </h3>
          <p className="mt-2 max-w-3xl text-sm text-white/60">
            Ce bloc t’aide à suivre tes points actuels, ton éligibilité et une estimation indicative
            de ta position dans le cycle mensuel.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70">
          <div className="font-semibold text-white">{summary.epochLabel}</div>
          <div className="mt-1 text-xs text-white/55">{summary.rangeLabel}</div>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-2xl border border-white/8 bg-white/[0.03]"
            />
          ))}
        </div>
      ) : error ? (
        <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-5 text-sm text-rose-100">
          Impossible de charger le suivi mensuel rewards ({error}).
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Mes points"
              value={summary.pointsLabel}
              hint="Points validés actuellement"
            />
            <StatCard
              label="Seuil minimum"
              value={summary.minPointsLabel}
              hint="Niveau requis pour entrer dans le cycle"
            />
            <StatCard
              label="Éligible"
              value={summary.eligibilityLabel}
              hint="État actuel sur ce cycle"
            />
            <StatCard
              label="Estimation actuelle"
              value={summary.estimateLabel}
              hint="Lecture indicative, selon les données du moment"
            />
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-white/8 bg-black/20 p-5">
              <div className="text-sm font-semibold text-white">Repères du cycle</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <div className="text-xs uppercase tracking-[0.14em] text-white/45">Pool mensuel</div>
                  <div className="mt-2 text-xl font-semibold text-white">{summary.poolLabel}</div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <div className="text-xs uppercase tracking-[0.14em] text-white/45">Statut du cycle</div>
                  <div className="mt-2 text-xl font-semibold text-white">{summary.claimedLabel}</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 bg-black/20 p-5">
              <div className="text-sm font-semibold text-white">Comprendre simplement</div>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-white/65">
                <li>Les quêtes validées génèrent des points.</li>
                <li>Si le seuil minimum est atteint, tu entres dans le cycle mensuel.</li>
                <li>L’estimation évolue selon les points éligibles de l’ensemble des participants.</li>
              </ul>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/rewards" className="inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
                Voir les règles
              </Link>

            {data?.isAdmin ? (
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={exporting}
                className="inline-flex items-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {exporting ? "Export..." : "Export CSV (Admin)"}
              </button>
            ) : null}
          </div>

          {exportMsg ? (
            <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
              {exportMsg}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
