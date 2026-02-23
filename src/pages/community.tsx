import dynamic from "next/dynamic";
import Script from "next/script";
import RequireWallet from "../components/RequireWallet";

const CommunityView = dynamic(() => import("../views/CommunityView"), { ssr: false });

export default function CommunityPage() {
  return (
    <>
      {/* Jupiter Plugin script (doit être dans le code, pas dans le terminal) */}
      <Script src="https://plugin.jup.ag/plugin-v1.js" strategy="beforeInteractive" />
      <RequireWallet>
        <CommunityView />
      </RequireWallet>
    </>
  );
}
