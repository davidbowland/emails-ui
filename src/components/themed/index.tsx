import { createTheme, ThemeProvider } from '@mui/material/styles'
import React, { useMemo } from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import useMediaQuery from '@mui/material/useMediaQuery'

import '@config/amplify'
import Disclaimer from '@components/disclaimer'

import '@assets/css/index.css'
import '@fontsource/roboto'

export interface ThemedProps {
  children: JSX.Element | JSX.Element[]
}

const Themed = ({ children }: ThemedProps): JSX.Element => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          background: {
            default: prefersDarkMode ? '#121212' : '#ededed',
            paper: prefersDarkMode ? '#121212' : '#fff',
          },
          mode: prefersDarkMode ? 'dark' : 'light',
        },
      }),
    [prefersDarkMode]
  )

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
      <Disclaimer />
    </ThemeProvider>
  )
}

export default Themed
