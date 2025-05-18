import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render() {
  return (
      <Html lang="es">
        <Head>
          {/* Precargar fuentes críticas */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          {/* Esta es la forma recomendada por Next.js para cargar fuentes */}
          <link 
            href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" 
            rel="preload"
            as="style"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
            rel="stylesheet"
            media="print"
            onLoad="this.media='all'"
          />
          <noscript>
            <link
              href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
              rel="stylesheet"
            />
          </noscript>
        </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
}

export default MyDocument;
