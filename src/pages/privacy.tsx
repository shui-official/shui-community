import Head from "next/head";

export default function PrivacyPage() {
  const updated = "2026-03-02";

  return (
    <>
      <Head>
        <title>Privacy Policy — SHUI</title>
        <meta name="description" content="SHUI privacy policy." />
        <meta name="robots" content="index,follow" />
      </Head>

      <main className="min-h-screen bg-white text-gray-900">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <h1 className="text-3xl font-bold tracking-tight">SHUI — Privacy Policy</h1>
          <p className="mt-2 text-sm text-gray-600">Last updated: {updated}</p>

          <section className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold">FR — Politique de confidentialité</h2>
            <p>
              SHUI (« nous ») respecte votre vie privée. Cette application permet d’accéder à des informations et
              fonctionnalités liées à l’écosystème SHUI et peut ouvrir des services tiers (ex : swap, explorateurs)
              via des liens externes.
            </p>

            <h3 className="text-lg font-semibold">Données collectées</h3>
            <p>
              Nous ne collectons pas d’informations personnelles directement dans l’application (nom, adresse, numéro
              de téléphone) et nous ne demandons jamais de seed phrase ou de clé privée.
            </p>

            <h3 className="text-lg font-semibold">Portefeuille (wallet)</h3>
            <p>
              Si vous connectez un portefeuille Solana via une application de wallet (ex : Phantom), l’adresse publique
              du wallet peut être affichée dans l’application pour fournir la fonctionnalité. Cette adresse n’est pas
              utilisée pour vous identifier personnellement.
            </p>

            <h3 className="text-lg font-semibold">Services tiers</h3>
            <p>
              Certaines fonctionnalités peuvent ouvrir des services externes (navigateur, swap, explorateurs). Ces
              services appliquent leurs propres règles de confidentialité.
            </p>

            <h3 className="text-lg font-semibold">Sécurité</h3>
            <p>
              Aucune transaction n’est requise pour la connexion. La connexion repose sur la signature de messages
              dans le wallet (preuve de possession) quand applicable.
            </p>

            <h3 className="text-lg font-semibold">Contact</h3>
            <p>
              Email :{" "}
              <a className="underline" href="mailto:shui.officialtoken@gmail.com">
                shui.officialtoken@gmail.com
              </a>
            </p>
          </section>

          <hr className="my-10" />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">EN — Privacy Policy</h2>
            <p>
              SHUI (“we”) respects your privacy. This app provides access to information and features related to the
              SHUI ecosystem and may open third-party services via external links.
            </p>

            <h3 className="text-lg font-semibold">Data Collection</h3>
            <p>
              We do not collect personal information directly in the app (name, address, phone number) and we never ask
              for seed phrases or private keys.
            </p>

            <h3 className="text-lg font-semibold">Wallet</h3>
            <p>
              If you connect a Solana wallet through a wallet app (e.g., Phantom), the public wallet address may be
              displayed to provide functionality. This address is not used to personally identify you.
            </p>

            <h3 className="text-lg font-semibold">Third-party Services</h3>
            <p>
              Some features may open external services (browser, swap, explorers). These services have their own
              privacy policies.
            </p>

            <h3 className="text-lg font-semibold">Security</h3>
            <p>
              No transaction is required to log in. When applicable, login relies on message signing in the wallet
              (proof of ownership).
            </p>

            <h3 className="text-lg font-semibold">Contact</h3>
            <p>
              Email:{" "}
              <a className="underline" href="mailto:shui.officialtoken@gmail.com">
                shui.officialtoken@gmail.com
              </a>
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
