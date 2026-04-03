import '@fontsource/roboto'
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
    <div className="min-h-screen bg-[#ededed] text-black dark:bg-[#121212] dark:text-white">
      <Component {...pageProps} />
      <Disclaimer />
    </div>
  )
}

export default App
