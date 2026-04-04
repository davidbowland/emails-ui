import Head from 'next/head'
import React from 'react'

import AccountSettings from '@components/account-settings'
import Authenticated from '@components/auth'

const SettingsPage = (): React.ReactNode => {
  return (
    <>
      <Head>
        <title>Email | dbowland.com</title>
      </Head>
      <div style={{ height: '100%', overflow: 'hidden' }}>
        <Authenticated>
          <AccountSettings />
        </Authenticated>
      </div>
    </>
  )
}

export default SettingsPage
