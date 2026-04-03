import Head from 'next/head'
import React from 'react'

import Authenticated from '@components/auth'
import Compose from '@components/compose'
import PrivacyLink from '@components/privacy-link'

const ComposePage = (): React.ReactNode => {
  return (
    <>
      <Head>
        <title>Email | dbowland.com</title>
      </Head>
      <main style={{ height: '100%' }}>
        <Authenticated>
          <div className="px-2">
            <Compose />
          </div>
        </Authenticated>
        <PrivacyLink />
      </main>
    </>
  )
}

export default ComposePage
