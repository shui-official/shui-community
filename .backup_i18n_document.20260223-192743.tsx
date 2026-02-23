import Document, { Html, Head, Main, NextScript, DocumentContext } from "next/document";

type Props = {
  locale?: string;
};

export default class MyDocument extends Document<Props> {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return {
      ...initialProps,
      locale: (ctx as any).locale || "fr",
    };
  }

  render() {
    const locale = (this.props as any).locale || "fr";
    return (
      <Html lang={locale}>
        <Head>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
