import Authenticated from '@components/auth'
import ServerErrorMessage from '@components/server-error-message'
import { HeadFC } from 'gatsby'
import React from 'react'

const InternalServerError = (): JSX.Element => {
  return (
    <Authenticated showContent={true}>
      <ServerErrorMessage title="500: Internal Server Error">
        An internal server error has occurred trying to serve your request. If you continue to experience this error,
        please contact the webmaster.
      </ServerErrorMessage>
    </Authenticated>
  )
}

export const Head: HeadFC = () => <title>500: Internal Server Error | dbowland.com</title>

export default InternalServerError
