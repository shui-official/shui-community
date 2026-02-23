import React, { useEffect, useMemo, useState } from "react";

type RewardsStatus = {
  ok: boolean;
  error?: string;

  epochId?: string;
  epochStart?: string;
  epochEnd?: string;

  poolShui?: number;
  minPoints?: number;

  myPoints?: number;
  eligible?: boolean;
  estimatedReward?: number;

  isAdmin?: boolean;
};

function downloadTextFile(filename: string, content: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function RewardsPanel() {
  const [status, setStatus] = useState<RewardsStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);

  const [showRules, setShowRules] = useState(false);

  const [exportLoading, setExportLoading] = useState(false);
  const [exportMsg, setExportMsg] = useState<string>("");

  const isAdmin = useMemo(() => Boolean(status?.isAdmin), [status]);

  async function loadStatus() {
    setLoadingStatus(true);
    setExportMsg("");

    try {
      const res = await fetch("/api/rewards/status", {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      const data = (await res.json()) as RewardsStatus;

      if (!res.ok) {
        setStatus({
          ok: false,
          error: data?.error || (res.status === 401 ? "unauthorized" : "error"),
          isAdmin: false,
        });
        return;
      }

      setStatus(data);
    } catch {
      setStatus({ ok: false, error: "network_error", isAdmin: false });
    } finally {
      setLoadingStatus(false);
    }
  }

  async function exportCsvAdmin() {
    setExportMsg("");

    if (!isAdmin) {
      setExportMsg("Admin only — ton wallet n’est pas dans REWARDS_ADMIN_WALLETS.");
      return;
    }

    setExportLoading(true);
    try {
      const res = await fetch("/api/rewards/export", {
        method: "GET",
        credentials: "include",
        headers: { Accept: "text/csv, application/json" },
      });

      const contentType = res.headers.get("content-type") || "";

      if (!res.ok) {
        if (contentType.includes("application/json")) {
          const j = await res.json();
          setExportMsg(
            j?.error === "forbidden"
              ? "Forbidden — session OK mais wallet non-admin ou env non chargé."
              : `Erreur export (${res.status})`
          );
        } else {
          setExportMsg(`Erreur export (${res.status})`);
        }
        return;
      }

      if (contentType.includes("text/csv")) {
        const csv = await res.text();
        downloadTextFile(
          `shui-rewards-export-${new Date().toISOString().slice(0, 10)}.csv`,
          csv,
          "text/csv;charset=utf-8"
        );
        setExportMsg("CSV téléchargé ✅");
        return;
      }

      const j = await res.json();
      if (j?.ok && typeof j?.csv === "string") {
        downloadTextFile(
          `shui-rewards-export-${new Date().toISOString().slice(0, 10)}.csv`,
          j.csv,
          "text/csv;charset=utf-8"
        );
        setExportMsg("CSV téléchargé ✅");
      } else {
        setExportMsg("Export OK mais format inattendu (ni CSV direct, ni {csv:string}).");
      }
    } catch {
      setExportMsg("Network error — impossible de contacter /api/rewards/export.");
    } finally {
      setExportLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  // Anti-ASI : aucun risque "return \\n <div>"
  const ui = (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Quêtes & Rewards (mensuel)</h3>
          <p className="mt-1 text-sm text-white/70">
            Points off-chain → éligibilité → export CSV (admin) → distribution via Multisender.
          </p>
        </div>

        <button
          type="button"
          onClick={loadStatus}
          className="shrink-0 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/15"
          disabled={loadingStatus}
        >
          {loadingStatus ? "Refresh..." : "Refresh"}
        </button>
      </div>

      <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
        {loadingStatus ? (
          <div className="text-sm text-white/70">Chargement…</div>
        ) : status?.ok ? (
          <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div className="text-white/70">
              <span className="font-medium text-white/90">Mes points:</span>{" "}
              {typeof status.myPoints === "number" ? status.myPoints : "—"}
            </div>
            <div className="text-white/70">
              <span className="font-medium text-white/90">Min points:</span>{" "}
              {typeof status.minPoints === "number" ? status.minPoints : "—"}
            </div>
            <div className="text-white/70">
              <span className="font-medium text-white/90">Pool mensuel:</span>{" "}
              {typeof status.poolShui === "number" ? `${status.poolShui.toLocaleString()} SHUI` : "—"}
            </div>
            <div className="text-white/70">
              <span className="font-medium text-white/90">Éligible:</span>{" "}
              {typeof status.eligible === "boolean" ? (status.eligible ? "Oui" : "Non") : "—"}
            </div>

            <div className="text-white/70 sm:col-span-2">
              <span className="font-medium text-white/90">Estimation:</span>{" "}
              {typeof status.estimatedReward === "number" ? `${status.estimatedReward.toLocaleString()} SHUI` : "—"}
            </div>

            <div className="text-white/70 sm:col-span-2">
              <span className="font-medium text-white/90">Admin:</span> {isAdmin ? "Oui (allowlist)" : "Non"}
            </div>
          </div>
        ) : (
          <div className="text-sm text-white/70">
            <span className="font-medium text-white/90">Status indisponible.</span>{" "}
            {status?.error ? <span className="text-white/60">({status.error})</span> : null}
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={() => setShowRules((v) => !v)}
          className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15"
        >
          {showRules ? "Masquer les règles" : "Voir les règles"}
        </button>

        <button
          type="button"
          onClick={exportCsvAdmin}
          disabled={!isAdmin || exportLoading}
          className={[
            "rounded-xl px-4 py-2 text-sm font-medium",
            !isAdmin || exportLoading
              ? "cursor-not-allowed border border-white/10 bg-white/5 text-white/40"
              : "border border-white/15 bg-white/10 hover:bg-white/15",
          ].join(" ")}
          title={!isAdmin ? "Admin only (REWARDS_ADMIN_WALLETS)" : "Exporter la liste"}
        >
          {exportLoading ? "Export..." : "Export CSV (Admin)"}
        </button>

        <a
          href="https://tools.smithii.io/multisender/solana"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15"
        >
          Multisender
        </a>
      </div>

      {exportMsg ? (
        <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/70">
          {exportMsg}
        </div>
      ) : null}

      {showRules ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
          <div className="font-medium text-white/90">Règles (résumé)</div>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Les quêtes ajoutent des points (off-chain).</li>
            <li>Éligibilité: points ≥ minimum.</li>
            <li>Rewards mensuels: pool SHUI réparti proportionnellement aux points.</li>
            <li>Distribution: export CSV (admin) puis envoi batch via Multisender.</li>
            <li>Connexion: signature d’un message uniquement (pas de transaction pour login).</li>
          </ul>
        </div>
      ) : null}
    </div>
  );

  return ui;
}
