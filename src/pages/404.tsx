import React from 'react'

import Authenticated from '@components/auth'
import ServerErrorMessage from '@components/server-error-message'

const NotFound = (): JSX.Element => {
  return (
    <Authenticated showContent={true}>
      <div className="main-content">
        <ServerErrorMessage title="404: Not Found">
          The resource you requested is unavailable. If you feel you have reached this page in error, please contact the
          webmaster.
        </ServerErrorMessage>
      </div>
    </Authenticated>
  )
}

export default NotFound
