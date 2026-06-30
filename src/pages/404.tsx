import Head from 'next/head'
import React from 'react'

import Authenticated from '@components/auth'
import ServerErrorMessage from '@components/server-error-message'

const NotFound = (): React.ReactNode => {
  return (
    <>
      <Head>
        <title>404: Not Found | dbowland.com</title>
      </Head>
      <Authenticated showContent={true}>
        <div className="main-content">
          <ServerErrorMessage title="404: Not Found">
            We couldn&apos;t find that page. If you think something&apos;s wrong, contact us.
          </ServerErrorMessage>
        </div>
      </Authenticated>
    </>
  )
}

export default NotFound
