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
      <main>
        <Authenticated showContent={true}>
          <div className="mx-auto max-w-[900px] shadow-md">
            <PrivacyPolicy />
          </div>
        </Authenticated>
      </main>
    </>
  )
}

export default PrivacyPage
