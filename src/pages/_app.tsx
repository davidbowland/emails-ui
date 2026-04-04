import '@fontsource/ibm-plex-mono'
import '@fontsource/libre-baskerville'
import '@fontsource/libre-baskerville/700.css'
import '@fontsource/outfit/300.css'
import '@fontsource/outfit/400.css'
import '@fontsource/outfit/500.css'
import '@fontsource/outfit/600.css'
import '@fontsource/source-serif-4'
import type { AppProps } from 'next/app'
import React, { useEffect } from 'react'

import '@assets/css/index.css'
import Disclaimer from '@components/disclaimer'
import '@config/amplify'

const App = ({ Component, pageProps }: AppProps): React.ReactNode => {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent): void => {
      document.documentElement.classList.toggle('dark', e.matches)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <div className="h-screen overflow-hidden" style={{ background: 'var(--shell-bg)', color: 'var(--text-primary)' }}>
      <Component {...pageProps} />
      <Disclaimer />
    </div>
  )
}

export default App
