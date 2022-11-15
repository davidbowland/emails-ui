import Grid from '@mui/material/Grid'
import { Helmet } from 'react-helmet'
import React from 'react'

import Authenticated from '@components/auth'
import Compose from '@components/compose'
import PrivacyLink from '@components/privacy-link'

const ComposePage = (): JSX.Element => {
  return (
    <main style={{ height: '100%' }}>
      <Helmet>
        <title>Email | dbowland.com</title>
      </Helmet>
      <Authenticated>
        <Grid container sx={{ padding: '25px 10px' }}>
          <Grid item xs>
            <Compose />
          </Grid>
        </Grid>
      </Authenticated>
      <PrivacyLink />
    </main>
  )
}

export default ComposePage
