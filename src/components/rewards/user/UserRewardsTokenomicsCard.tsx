import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { UserRewardsSummary } from "../../../lib/rewards/selectors";

type ApiResponse = {
  ok: boolean;
  error?: string;
  summary?: UserRewardsSummary;
};

type RewardsUiStatus = "empty" | "immediate_only" | "vesting_active" | "vesting_completed";

function formatShui(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 9,
  }).format(value || 0);
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value || 0);
}

function formatMonthLabel(periodOrDate: string | null): string {
  if (!periodOrDate) return "—";

  const raw = String(periodOrDate).trim();

  if (/^\d{4}-\d{2}$/.test(raw)) {
    const [year, month] = raw.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return new Intl.DateTimeFormat("fr-FR", {
      month: "long",
      year: "numeric",
    }).format(date);
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;

  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function metricWidth(part: number, total: number): string {
  if (total <= 0) return "0%";
  return `${Math.max(0, Math.min(100, (part / total) * 100))}%`;
}

function getUiStatus(data: UserRewardsSummary | null): RewardsUiStatus {
  if (!data) return "empty";
  if (data.personalTotalShui <= 0) return "empty";
  if (data.personalVestingTotalShui <= 0 && data.personalImmediateShui > 0) return "immediate_only";
  if (data.personalVestingTotalShui > 0 && data.personalVestingRemainingShui <= 0) return "vesting_completed";
  return "vesting_active";
}

function getStatusMeta(data: UserRewardsSummary | null): {
  status: RewardsUiStatus;
  badge: string;
  title: string;
  description: string;
} {
  const status = getUiStatus(data);

  if (status === "empty") {
    return {
      status,
      badge: "Aucune distribution",
      title: "Tu n’as pas encore de rewards distribués",
      description:
        "Commence par valider des quêtes, accumuler des points et participer aux prochains cycles de distribution SHUI.",
    };
  }

  if (status === "immediate_only") {
    return {
      status,
      badge: "Immédiat",
      title: "Une distribution immédiate est déjà attribuée",
      description:
        "Une partie de tes SHUI a été attribuée sans attente. Tu pourras voir ici les prochaines phases si un vesting est ajouté ensuite.",
    };
  }

  if (status === "vesting_completed") {
    return {
      status,
      badge: "Terminé",
      title: "Ton vesting est entièrement débloqué",
      description:
        "Toutes les tranches prévues ont déjà été libérées. Ce bloc reste ton repère de transparence sur l’historique rewards.",
    };
  }

  return {
    status,
    badge: "En cours",
    title: data?.personalNextUnlockDate
      ? `Prochaine libération : ${formatMonthLabel(data.personalNextUnlockDate)}`
      : "Vesting en cours",
    description:
      "Une partie de tes SHUI a déjà été attribuée, le reste suit une libération progressive dans le temps.",
  };
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-white">{title}</div>
          {subtitle ? <div className="mt-1 text-xs text-white/50">{subtitle}</div> : null}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function MetricItem({
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
      <div className="mt-2 text-xl font-semibold text-white">{value}</div>
      {hint ? <div className="mt-1 text-xs text-white/45">{hint}</div> : null}
    </div>
  );
}

function StatusBadge({ status }: { status: RewardsUiStatus }) {
  const map = {
    empty: "border-white/10 bg-white/[0.04] text-white/70",
    immediate_only: "border-cyan-400/20 bg-cyan-400/10 text-cyan-200",
    vesting_active: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
    vesting_completed: "border-indigo-400/20 bg-indigo-400/10 text-indigo-200",
  } as const;

  const labelMap = {
    empty: "Aucune distribution",
    immediate_only: "Immédiat",
    vesting_active: "Vesting en cours",
    vesting_completed: "Vesting terminé",
  } as const;

  return (
    <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${map[status]}`}>
      {labelMap[status]}
    </div>
  );
}

function UserRewardsEducationNote() {
  return (
    <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.04] p-4">
      <div className="text-sm font-semibold text-white">Comment lire cette section</div>
      <p className="mt-2 text-sm leading-6 text-white/65">
        Tes quêtes validées génèrent des points convertibles en SHUI. Une partie peut être attribuée immédiatement,
        tandis que le reste peut être libéré progressivement sous forme de vesting.
      </p>
    </div>
  );
}

function UserRewardsEmptyState() {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="flex flex-col gap-4">
        <div>
          <div className="text-sm font-semibold text-white">Commencer à générer des rewards</div>
          <p className="mt-2 text-sm leading-6 text-white/65">
            Ton dashboard est prêt. Dès que tu accumules des points via les quêtes et que tu participes aux cycles
            mensuels, tes distributions SHUI apparaîtront ici.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.14em] text-white/45">Étape 1</div>
            <div className="mt-2 text-base font-semibold text-white">Valider des quêtes</div>
            <div className="mt-1 text-sm text-white/55">Tu génères des points de contribution.</div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.14em] text-white/45">Étape 2</div>
            <div className="mt-2 text-base font-semibold text-white">Participer au cycle mensuel</div>
            <div className="mt-1 text-sm text-white/55">Les points sont pris en compte dans les distributions SHUI.</div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.14em] text-white/45">Étape 3</div>
            <div className="mt-2 text-base font-semibold text-white">Suivre ton avancement</div>
            <div className="mt-1 text-sm text-white/55">Immédiat, vesting, déblocages et capacité mensuelle.</div>
          </div>
        </div>

        <div className="text-sm text-cyan-200/80">
          Conseil : commence par l’onglet <span className="font-semibold text-white">Quêtes</span> pour activer ta progression.
        </div>
      </div>
    </div>
  );
}

export default function UserRewardsTokenomicsCard() {
  const [data, setData] = useState<UserRewardsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/rewards/user-summary", {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        const json = (await res.json()) as ApiResponse;

        if (!res.ok || !json?.ok || !json?.summary) {
          throw new Error(json?.error || "user_summary_unavailable");
        }

        if (!cancelled) {
          setData(json.summary);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "user_summary_unavailable");
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

  const progress = useMemo(() => {
    if (!data) {
      return {
        immediateWidth: "0%",
        releasedWidth: "0%",
        remainingWidth: "0%",
        vestingReleasedWidth: "0%",
      };
    }

    return {
      immediateWidth: metricWidth(data.personalImmediateShui, data.personalTotalShui),
      releasedWidth: metricWidth(data.personalVestingCompletedShui, data.personalTotalShui),
      remainingWidth: metricWidth(data.personalVestingRemainingShui, data.personalTotalShui),
      vestingReleasedWidth: metricWidth(
        data.personalVestingCompletedShui,
        data.personalVestingTotalShui
      ),
    };
  }, [data]);

  const statusMeta = useMemo(() => getStatusMeta(data), [data]);
  const isEmpty = statusMeta.status === "empty";

  return (
    <div className="rounded-[28px] border border-cyan-400/10 bg-white/[0.04] p-6 shadow-[0_20px_80px_rgba(2,12,27,0.45)] backdrop-blur-xl">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
            Suivi rewards / tokenomics
          </div>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            Une lecture claire de tes SHUI
          </h3>
          <p className="mt-2 max-w-3xl text-sm text-white/60">
            Tu vois ici ce qui t’a déjà été attribué immédiatement, ce qui suit un vesting progressif,
            ce qui a déjà été débloqué, ce qui reste à venir et la capacité mensuelle globale du système.
          </p>
        </div>

        {data ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70">
            Période affichée :{" "}
            <span className="font-semibold text-white">
              {formatMonthLabel(data.monthlyPeriod)}
            </span>
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-2xl border border-white/8 bg-white/[0.03]"
            />
          ))}
        </div>
      ) : error ? (
        <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-5 text-sm text-rose-100">
          Impossible de charger le suivi rewards pour le moment ({error}).
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="max-w-3xl">
                <StatusBadge status={statusMeta.status} />
                <div className="mt-3 text-xl font-semibold text-white">{statusMeta.title}</div>
                <p className="mt-2 text-sm leading-6 text-white/65">{statusMeta.description}</p>
              </div>

              {data && !isEmpty ? (
                <div className="min-w-[220px] rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <div className="text-xs uppercase tracking-[0.14em] text-white/45">Prochaine étape</div>
                  <div className="mt-2 text-base font-semibold text-white">
                    {data.personalNextUnlockDate
                      ? `${formatMonthLabel(data.personalNextUnlockDate)}`
                      : "Aucune échéance à venir"}
                  </div>
                  <div className="mt-1 text-sm text-white/55">
                    {data.personalNextUnlockAmount > 0
                      ? `${formatShui(data.personalNextUnlockAmount)} SHUI`
                      : "—"}
                  </div>
                  <div className="mt-3 text-xs text-white/45">
                    {data.personalRemainingInstallmentsCount} tranche(s) restante(s)
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <UserRewardsEducationNote />

          {isEmpty ? (
            <UserRewardsEmptyState />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              <SectionCard
                title="Résumé personnel"
                subtitle="Lecture rapide de ta situation rewards"
              >
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <MetricItem
                    label="Total généré"
                    value={`${formatShui(data?.personalTotalShui || 0)} SHUI`}
                    hint="Immédiat + vesting total"
                  />
                  <MetricItem
                    label="Immédiat"
                    value={`${formatShui(data?.personalImmediateShui || 0)} SHUI`}
                    hint="Attribué sans attente"
                  />
                  <MetricItem
                    label="Vesting total"
                    value={`${formatShui(data?.personalVestingTotalShui || 0)} SHUI`}
                    hint="Prévu pour une libération progressive"
                  />
                  <MetricItem
                    label="Déjà débloqué"
                    value={`${formatShui(data?.personalVestingCompletedShui || 0)} SHUI`}
                    hint="Tranches vesting déjà complétées"
                  />
                  <MetricItem
                    label="À venir"
                    value={`${formatShui(data?.personalVestingRemainingShui || 0)} SHUI`}
                    hint="Reste à débloquer progressivement"
                  />
                  <MetricItem
                    label="Tranches restantes"
                    value={String(data?.personalRemainingInstallmentsCount || 0)}
                    hint="Nombre d’échéances encore à venir"
                  />
                </div>
              </SectionCard>

              <SectionCard
                title="Progression visuelle"
                subtitle="Immédiat, déjà débloqué et reste à venir"
              >
                <div className="space-y-5">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs text-white/55">
                      <span>Répartition globale</span>
                      <span>{formatShui(data?.personalTotalShui || 0)} SHUI</span>
                    </div>
                    <div className="h-4 overflow-hidden rounded-full bg-white/8">
                      <div className="flex h-full w-full">
                        <div
                          className="h-full bg-cyan-400/90"
                          style={{ width: progress.immediateWidth }}
                          title="Immédiat"
                        />
                        <div
                          className="h-full bg-emerald-400/90"
                          style={{ width: progress.releasedWidth }}
                          title="Déjà débloqué"
                        />
                        <div
                          className="h-full bg-indigo-400/80"
                          style={{ width: progress.remainingWidth }}
                          title="À venir"
                        />
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3 text-xs text-white/60">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
                        <span>Immédiat</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                        <span>Déjà débloqué</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-indigo-400" />
                        <span>À venir</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs text-white/55">
                      <span>Progression du vesting</span>
                      <span>
                        {formatShui(data?.personalVestingCompletedShui || 0)} / {formatShui(data?.personalVestingTotalShui || 0)} SHUI
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                        style={{ width: progress.vestingReleasedWidth }}
                      />
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="Capacité mensuelle"
                subtitle="Repère global du mois en cours, basé sur les distributions déjà complétées"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <MetricItem
                    label="Plafond mensuel global"
                    value={`${formatShui(data?.monthlyCapShui || 0)} SHUI`}
                    hint="Capacité théorique maximale du mois"
                  />
                  <MetricItem
                    label="Déjà distribué"
                    value={`${formatShui(data?.monthlyDistributedShui || 0)} SHUI`}
                    hint="Basé sur le ledger complété"
                  />
                  <MetricItem
                    label="Encore disponible"
                    value={`${formatShui(data?.monthlyRemainingShui || 0)} SHUI`}
                    hint="Capacité restante sur le mois"
                  />
                  <MetricItem
                    label="Part utilisée ce mois-ci"
                    value={`${formatPercent(data?.monthlyUsedPercent || 0)} %`}
                    hint={formatMonthLabel(data?.monthlyPeriod || null)}
                  />
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-xs text-white/55">
                    <span>Utilisation mensuelle</span>
                    <span>{formatPercent(data?.monthlyUsedPercent || 0)} %</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400"
                      style={{ width: `${Math.max(0, Math.min(100, data?.monthlyUsedPercent || 0))}%` }}
                    />
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="Prochaines libérations"
                subtitle="Ce qui reste à venir sur ton vesting"
              >
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <div className="text-xs uppercase tracking-[0.14em] text-white/45">
                    Prochain unlock
                  </div>
                  <div className="mt-2 text-xl font-semibold text-white">
                    {data?.personalNextUnlockDate
                      ? `${formatMonthLabel(data.personalNextUnlockDate)} — ${formatShui(
                          data.personalNextUnlockAmount
                        )} SHUI`
                      : "Aucun déblocage à venir"}
                  </div>
                  <div className="mt-1 text-xs text-white/45">
                    {(data?.personalRemainingInstallmentsCount || 0) > 0
                      ? `${data?.personalRemainingInstallmentsCount || 0} tranche(s) restante(s)`
                      : "Vesting terminé ou aucun vesting en cours"}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {(data?.upcomingUnlocks?.length || 0) > 0 ? (
                    data!.upcomingUnlocks.map((item) => (
                      <div
                        key={item.installmentId}
                        className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 transition-all duration-200 hover:border-white/12 hover:bg-white/[0.045]"
                      >
                        <div className="text-sm text-white/70">
                          {formatMonthLabel(item.unlockPeriod)}
                        </div>
                        <div className="text-sm font-semibold text-white">
                          {formatShui(item.plannedAmount)} SHUI
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/55">
                      Aucune échéance vesting à afficher pour ce wallet.
                    </div>
                  )}
                </div>
              </SectionCard>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
