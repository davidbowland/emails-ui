import Authenticated from '@components/auth'
import Compose from '@components/compose'
import PrivacyLink from '@components/privacy-link'
import React from 'react'
import { Helmet } from 'react-helmet'

import Grid from '@mui/material/Grid'

const ComposePage = (): JSX.Element => {
  return (
    <main style={{ height: '100%' }}>
      <Helmet>
        <title>Email | dbowland.com</title>
      </Helmet>
      <Authenticated>
        <Grid container sx={{ padding: '0px 10px' }}>
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
