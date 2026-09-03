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
        {/*
          The only indexable page in this app -- every other route carries `noindex, nofollow`.
          Hardcoded to production on purpose: this same build is deployed byte for byte to
          email.bowland.link, and the canonical is what tells a search engine which copy is the
          original.
        */}
        <link href="https://email.dbowland.com/privacy-policy/" rel="canonical" />
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
