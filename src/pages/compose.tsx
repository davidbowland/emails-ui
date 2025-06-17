import Authenticated from '@components/auth'
import Compose from '@components/compose'
import PrivacyLink from '@components/privacy-link'
import { HeadFC } from 'gatsby'
import React from 'react'

import Grid from '@mui/material/Grid'

const ComposePage = (): JSX.Element => {
  return (
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
  )
}

export const Head: HeadFC = () => <title>Email | dbowland.com</title>

export default ComposePage
