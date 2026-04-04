import { Head, Html, Main, NextScript } from 'next/document'
import React from 'react'

const Document = (): React.ReactNode => {
  return (
    <Html lang="en">
      <Head />
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
