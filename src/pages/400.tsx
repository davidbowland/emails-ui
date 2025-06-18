import Authenticated from '@components/auth'
import ServerErrorMessage from '@components/server-error-message'
import { HeadFC } from 'gatsby'
import React from 'react'

const BadRequest = (): JSX.Element => {
  return (
    <Authenticated showContent={true}>
      <ServerErrorMessage title="400: Bad Request">
        Your request was malformed or otherwise could not be understood by the server. Please modify your request before
        retrying.
      </ServerErrorMessage>
    </Authenticated>
  )
}

export const Head: HeadFC = () => <title>400: Bad Request | dbowland.com</title>

export default BadRequest
