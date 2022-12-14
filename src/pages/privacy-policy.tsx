import { Helmet } from 'react-helmet'
import Paper from '@mui/material/Paper'
import React from 'react'

import '@config/amplify'
import Authenticated from '@components/auth'
import PrivacyPolicy from '@components/privacy-policy'

const PrivacyPage = (): JSX.Element => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy -- dbd.dbowland.com</title>
      </Helmet>
      <main>
        <Authenticated showContent={true}>
          <Paper elevation={3} sx={{ margin: 'auto', maxWidth: '900px' }}>
            <PrivacyPolicy />
          </Paper>
        </Authenticated>
      </main>
    </>
  )
}

export default PrivacyPage
