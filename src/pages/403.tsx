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
          You are not allowed to access the resource you requested. If you feel you have reached this page in error,
          please contact the webmaster.
        </ServerErrorMessage>
      </Authenticated>
    </>
  )
}

export default Forbidden
