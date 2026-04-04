import Head from 'next/head'
import React from 'react'

import Authenticated from '@components/auth'
import ServerErrorMessage from '@components/server-error-message'

const InternalServerError = (): React.ReactNode => {
  return (
    <>
      <Head>
        <title>500: Internal Server Error | dbowland.com</title>
      </Head>
      <Authenticated showContent={true}>
        <ServerErrorMessage title="500: Internal Server Error">
          An internal server error has occurred trying to serve your request. If you continue to experience this error,
          please contact the webmaster.
        </ServerErrorMessage>
      </Authenticated>
    </>
  )
}

export default InternalServerError
