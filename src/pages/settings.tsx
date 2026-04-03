import Head from 'next/head'
import React from 'react'

import AccountSettings from '@components/account-settings'
import Authenticated from '@components/auth'
import PrivacyLink from '@components/privacy-link'

const SettingsPage = (): React.ReactNode => {
  return (
    <>
      <Head>
        <title>Email | dbowland.com</title>
      </Head>
      <main style={{ height: '100%' }}>
        <Authenticated>
          <div className="px-2">
            <AccountSettings />
          </div>
        </Authenticated>
        <PrivacyLink />
      </main>
    </>
  )
}

export default SettingsPage
