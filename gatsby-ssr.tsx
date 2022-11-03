import type { GatsbyBrowser } from 'gatsby'
import Paper from '@mui/material/Paper'
import React from 'react'

import '@config/amplify'
import Themed from '@components/themed'

export const wrapPageElement: GatsbyBrowser['wrapPageElement'] = ({ element }): JSX.Element => {
  return (
    <Themed>
      <Paper elevation={3}>{element}</Paper>
    </Themed>
  )
}
