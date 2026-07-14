import { Head, Html, Main, NextScript } from 'next/document'
import React from 'react'

const Document = (): React.ReactNode => {
  return (
    <Html lang="en">
      <Head>
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
        <link href="/favicon.ico" rel="icon" sizes="any" />
        <link href="/apple-touch-icon.png" rel="apple-touch-icon" />
        <meta content="website" property="og:type" />
        <meta content="Email" property="og:site_name" />
        <meta content="https://email.dbowland.com/og-image.png" property="og:image" />
        <meta content="1200" property="og:image:width" />
        <meta content="630" property="og:image:height" />
        <meta content="summary_large_image" name="twitter:card" />
      </Head>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark')}catch(e){}})()",
          }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}

export default Document
