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
          Something went wrong on our end. Try refreshing the page. If the problem keeps happening, contact us.
        </ServerErrorMessage>
      </Authenticated>
    </>
  )
}

export default InternalServerError
