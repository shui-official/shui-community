import Head from "next/head";
import Link from "next/link";

export default function RewardsPage() {
  return (
    <div className="min-h-screen bg-[#0b1220] text-white">
      <Head>
        <title>SHUI — Rewards</title>
        <meta name="description" content="Règles & transparence des rewards mensuels SHUI." />
      </Head>

      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_30%_20%,rgba(59,130,246,0.18),transparent_60%),radial-gradient(45%_45%_at_70%_25%,rgba(168,85,247,0.14),transparent_60%),radial-gradient(40%_40%_at_55%_85%,rgba(16,185,129,0.10),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/70" />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 py-10 space-y-6">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-full ring-1 ring-white/10 bg-black/20">
              <img src="/shui-token.png" alt="SHUI Token" className="h-full w-full object-cover" />
            </div>
            <div className="leading-tight">
              <div className="text-lg font-semibold tracking-wide">SHUI</div>
              <div className="text-xs text-white/60">Rewards mensuels — règles & transparence</div>
            </div>
          </div>

          <Link href="/community" passHref>
            <a className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
              Aller à /community
            </a>
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <h1 className="text-3xl font-bold">Rewards mensuels</h1>
          <p className="mt-3 text-white/70">
            Les rewards sont basés sur un <strong className="text-white">score de contribution</strong> (points) acquis via des quêtes.
            <br />
            Les points ne sont <strong className="text-white">pas</strong> un token : ils servent à mesurer l’engagement et l’éligibilité.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-sm font-semibold">Comment ça marche</div>
              <ul className="mt-3 space-y-2 text-sm text-white/70">
                <li>• Tu fais des quêtes → tu gagnes des points.</li>
                <li>• Chaque mois : snapshot des points éligibles.</li>
                <li>• Un pool SHUI mensuel est réparti proportionnellement.</li>
                <li>• Distribution réalisée en batch (airdrop) depuis le wallet marketing/airdrop officiel.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-sm font-semibold">FAQ rapide</div>
              <ul className="mt-3 space-y-2 text-sm text-white/70">
                <li>• Recevoir SHUI ne nécessite pas de SOL.</li>
                <li>• SOL est nécessaire seulement si tu fais une transaction (swap/transfer).</li>
                <li>• Connexion au site = signature message, pas transaction.</li>
              </ul>
            </div>
          </div>

          <div className="mt-5 text-xs text-white/50">
            Transparence : la distribution mensuelle peut être accompagnée de liens Solscan (transactions) et d’un récap.
          </div>
        </div>
      </div>
    </div>
  );
}
