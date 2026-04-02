import Head from 'next/head'
import React from 'react'

import Grid from '@mui/material/Grid'

import Authenticated from '@components/auth'
import Compose from '@components/compose'
import PrivacyLink from '@components/privacy-link'

const ComposePage = (): React.ReactNode => {
  return (
    <>
      <Head>
        <title>Email | dbowland.com</title>
      </Head>
      <main style={{ height: '100%' }}>
        <Authenticated>
          <Grid container sx={{ padding: '0px 10px' }}>
            <Grid item xs>
              <Compose />
            </Grid>
          </Grid>
        </Authenticated>
        <PrivacyLink />
      </main>
    </>
  )
}

export default ComposePage
