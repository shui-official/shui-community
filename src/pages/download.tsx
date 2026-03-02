import Head from "next/head";
import type { GetServerSideProps } from "next";

type Props = { url: string };

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  // Static file served from /public/downloads/shui-latest.apk
  const url = "/downloads/shui-latest.apk";
  return {
    redirect: {
      destination: url,
      permanent: false,
    },
  };
};

export default function DownloadPage({ url }: Props) {
  // Fallback UI (normally user is redirected)
  return (
    <>
      <Head>
        <title>Download — SHUI App</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <main className="min-h-screen bg-white text-gray-900">
        <div className="mx-auto max-w-2xl px-4 py-10">
          <h1 className="text-2xl font-bold">Download SHUI (Android)</h1>
          <p className="mt-4">
            If the download doesn’t start automatically, click:
          </p>
          <p className="mt-2">
            <a className="underline" href={url}>
              {url}
            </a>
          </p>
        </div>
      </main>
    </>
  );
}
