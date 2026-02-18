import Document, { Html, Head, Main, NextScript } from "next/document";

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="fr">
        <Head>
          {/* Favicon */}
          <link rel="icon" href="/favicon.ico" />
          {/* Optionnel: PNG fallback si tu préfères */}
          {/* <link rel="icon" type="image/png" href="/shui-token.png" /> */}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
