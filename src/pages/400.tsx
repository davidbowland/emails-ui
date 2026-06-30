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
          Something went wrong with your request. Try going back and refreshing the page.
        </ServerErrorMessage>
      </Authenticated>
    </>
  )
}

export default BadRequest
