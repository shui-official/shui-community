import Head from "next/head";

export default function PrivacyPage() {
  const site = "https://shui-community.vercel.app";
  const email = "shui.officialtoken@gmail.com";

  return (
    <>
      <Head>
        <title>SHUI — Privacy Policy</title>
        <meta
          name="description"
          content="Privacy policy for the SHUI app and website."
        />
      </Head>

      <main style={{ maxWidth: 920, margin: "0 auto", padding: "28px 16px", color: "white" }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ opacity: 0.85, marginBottom: 18 }}>
          Last updated: {new Date().toISOString().slice(0, 10)}
        </p>

        <section style={sectionStyle}>
          <h2 style={h2Style}>1) Overview</h2>
          <p style={pStyle}>
            SHUI (水) is a community project on Solana. This page explains what the SHUI app/website
            does with data and how to stay safe.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>2) What we collect</h2>
          <ul style={ulStyle}>
            <li style={liStyle}>
              <b>Local preferences</b> (example: selected language) stored on your device.
            </li>
            <li style={liStyle}>
              If you enable member features later: a <b>session token</b> may be stored locally to keep you signed in.
            </li>
          </ul>
          <p style={pStyle}>
            We do <b>not</b> collect seed phrases or private keys. We will never ask for them.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>3) Wallet & external links (Phantom / Jupiter)</h2>
          <p style={pStyle}>
            The SHUI app can open external applications/websites (example: Phantom and Jupiter) for wallet
            connection and swaps. These actions happen outside the SHUI app and are confirmed by you inside your wallet.
          </p>
          <p style={pStyle}>
            <b>Connection ≠ transaction</b>: connecting a wallet should not require a transaction. If your wallet requests an unexpected
            transaction, cancel and verify official links.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>4) Data sharing</h2>
          <p style={pStyle}>
            We do not sell personal data. We do not share seed phrases or private keys (we never receive them).
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>5) Security tips</h2>
          <ul style={ulStyle}>
            <li style={liStyle}>Never share your seed phrase / private key.</li>
            <li style={liStyle}>Always verify the token mint address and official links.</li>
            <li style={liStyle}>If something looks suspicious, stop and ask the community/support.</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>6) Contact</h2>
          <p style={pStyle}>
            Support email: <a href={`mailto:${email}`} style={aStyle}>{email}</a>
          </p>
          <p style={pStyle}>
            Official website: <a href={site} target="_blank" rel="noreferrer" style={aStyle}>{site}</a>
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>7) Disclaimer</h2>
          <p style={pStyle}>
            This document is informational and does not constitute financial advice. Crypto assets are volatile and
            may result in total loss. You act under your own responsibility.
          </p>
        </section>
      </main>
    </>
  );
}

const sectionStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 16,
  padding: 16,
  marginBottom: 12,
};

const h2Style: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
  marginBottom: 8,
};

const pStyle: React.CSSProperties = {
  opacity: 0.9,
  lineHeight: 1.6,
  marginBottom: 10,
};

const ulStyle: React.CSSProperties = { paddingLeft: 18, marginTop: 8, marginBottom: 10 };
const liStyle: React.CSSProperties = { marginBottom: 8, opacity: 0.9, lineHeight: 1.5 };
const aStyle: React.CSSProperties = { color: "#7FE8FF", fontWeight: 800 };
