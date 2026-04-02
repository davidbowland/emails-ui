import Head from 'next/head'
import React from 'react'

import Authenticated from '@components/auth'
import ServerErrorMessage from '@components/server-error-message'

const BadRequest = (): React.ReactNode => {
  return (
    <>
      <Head>
        <title>400: Bad Request | dbowland.com</title>
      </Head>
      <Authenticated showContent={true}>
        <ServerErrorMessage title="400: Bad Request">
          Your request was malformed or otherwise could not be understood by the server. Please modify your request
          before retrying.
        </ServerErrorMessage>
      </Authenticated>
    </>
  )
}

export default BadRequest
