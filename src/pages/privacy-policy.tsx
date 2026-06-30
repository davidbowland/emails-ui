import Head from 'next/head'
import React from 'react'

import Authenticated from '@components/auth'
import PrivacyPolicy from '@components/privacy-policy'
import '@config/amplify'

const PrivacyPage = (): React.ReactNode => {
  return (
    <>
      <Head>
        <title>Privacy Policy | dbowland.com</title>
      </Head>
      <div style={{ height: '100%', overflow: 'hidden' }}>
        <Authenticated showContent={true}>
          <PrivacyPolicy />
        </Authenticated>
      </div>
    </>
  )
}

export default PrivacyPage
