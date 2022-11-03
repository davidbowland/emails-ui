import '@aws-amplify/ui-react/styles.css'
import React, { useEffect, useState } from 'react'
import { AmplifyUser } from '@aws-amplify/ui'
import AppBar from '@mui/material/AppBar'
import { Auth } from 'aws-amplify'
import Toolbar from '@mui/material/Toolbar'

import EmailsAuthenticator from './emails-authenticator'
import LoggedInBar from './logged-in-bar'
import LoggedOutBar from './logged-out-bar'

export interface AuthenticatedProps {
  children: JSX.Element | JSX.Element[]
  showContent?: boolean
}

const Authenticated = ({ children, showContent = false }: AuthenticatedProps): JSX.Element => {
  const [loggedInUser, setLoggedInUser] = useState<AmplifyUser | undefined>(undefined)

  // Set user if already logged in
  useEffect(() => {
    Auth.currentAuthenticatedUser()
      .then(setLoggedInUser)
      .catch(() => null)
  }, [])

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          {loggedInUser ? (
            <LoggedInBar loggedInUser={loggedInUser} setLoggedInUser={setLoggedInUser} />
          ) : (
            <LoggedOutBar />
          )}
        </Toolbar>
      </AppBar>
      {showContent || loggedInUser ? children : <EmailsAuthenticator setLoggedInUser={setLoggedInUser} />}
    </>
  )
}

export default Authenticated
