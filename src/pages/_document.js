import { Html, Head, Main, NextScript } from 'next/document'
import Script from "next/script";

export default function Document() {
  return (
    <Html lang="es">
      <Head />
      <body>
      {/* <!-- Google tag (gtag.js) --> */}
        {process.env.NODE_ENV === 'production' && <Script strategy="lazyOnload" src="https://www.googletagmanager.com/gtag/js?id=G-20BMCR1TCJ"></Script>}
        {process.env.NODE_ENV === 'production' && <Script strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-20BMCR1TCJ');
          `}
        </Script>}
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
