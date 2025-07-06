import { HeadFC } from 'gatsby'
import React from 'react'

import Grid from '@mui/material/Grid'

import AccountSettings from '@components/account-settings'
import Authenticated from '@components/auth'
import PrivacyLink from '@components/privacy-link'

const SettingsPage = (): JSX.Element => {
  return (
    <main style={{ height: '100%' }}>
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

export const Head: HeadFC = () => <title>Email | dbowland.com</title>

export default SettingsPage
