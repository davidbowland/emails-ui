import Grid from '@mui/material/Grid'
import { Helmet } from 'react-helmet'
import React from 'react'

import AccountSettings from '@components/account-settings'
import Authenticated from '@components/auth'
import PrivacyLink from '@components/privacy-link'

const SettingsPage = (): JSX.Element => {
  return (
    <main style={{ height: '100%' }}>
      <Helmet>
        <title>Email | dbowland.com</title>
      </Helmet>
      <Authenticated>
        <Grid container sx={{ padding: '0px 10px' }}>
          <Grid item xs>
            <AccountSettings />
          </Grid>
        </Grid>
      </Authenticated>
      <PrivacyLink />
    </main>
  )
}

export default SettingsPage
