import Head from 'next/head'
import React from 'react'

import Authenticated from '@components/auth'
import ServerErrorMessage from '@components/server-error-message'

const Forbidden = (): React.ReactNode => {
  return (
    <>
      <Head>
        <title>403: Forbidden | dbowland.com</title>
      </Head>
      <Authenticated showContent={true}>
        <ServerErrorMessage title="403: Forbidden">
          You don&apos;t have permission to view this page. If you think that&apos;s a mistake, contact us.
        </ServerErrorMessage>
      </Authenticated>
    </>
  )
}

export default Forbidden
