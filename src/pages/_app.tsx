import type { AppProps } from 'next/app'
import React from 'react'

import Paper from '@mui/material/Paper'

import Themed from '@components/themed'
import '@config/amplify'

const App = ({ Component, pageProps }: AppProps): React.ReactNode => {
  return (
    <Themed>
      <Paper elevation={3}>
        <Component {...pageProps} />
      </Paper>
    </Themed>
  )
}

export default App
