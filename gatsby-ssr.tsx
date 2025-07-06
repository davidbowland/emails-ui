import type { GatsbyBrowser } from 'gatsby'
import React from 'react'

import Paper from '@mui/material/Paper'

import Themed from '@components/themed'
import '@config/amplify'

export const wrapPageElement: GatsbyBrowser['wrapPageElement'] = ({ element }): JSX.Element => {
  return (
    <Themed>
      <Paper elevation={3}>{element}</Paper>
    </Themed>
  )
}
