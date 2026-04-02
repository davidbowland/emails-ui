import Head from 'next/head'
import React from 'react'

import Paper from '@mui/material/Paper'

import Authenticated from '@components/auth'
import PrivacyPolicy from '@components/privacy-policy'
import '@config/amplify'

const PrivacyPage = (): React.ReactNode => {
  return (
    <>
      <Head>
        <title>Privacy Policy | dbowland.com</title>
      </Head>
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
