import '@aws-amplify/ui-react/styles.css'
import { Auth } from 'aws-amplify'
import React, { useEffect, useState } from 'react'

import EmailsAuthenticator from './emails-authenticator'
import IconDrawer from './icon-drawer'
import LoggedInBar from './logged-in-bar'
import LoggedOutBar from './logged-out-bar'
import { AmplifyUser } from '@types'

export interface AuthenticatedProps {
  children: React.ReactNode
  showContent?: boolean
}

const Authenticated = ({ children, showContent = false }: AuthenticatedProps): React.ReactNode => {
  const [loggedInUser, setLoggedInUser] = useState<AmplifyUser | undefined>()
  const [navMenuOpen, setNavMenuOpen] = useState(false)

  const closeMenu = (): void => {
    setNavMenuOpen(false)
  }

  const openMenu = (): void => {
    setNavMenuOpen(true)
  }

  const renderChildren = (): React.ReactNode => {
    if (loggedInUser) {
      return (
        <IconDrawer
          closeMenu={closeMenu}
          loggedInUser={loggedInUser}
          navMenuOpen={navMenuOpen}
          setLoggedInUser={setLoggedInUser}
        >
          {children}
        </IconDrawer>
      )
    }
    if (showContent) {
      return children
    }
    return <EmailsAuthenticator setLoggedInUser={setLoggedInUser} />
  }

  useEffect(() => {
    Auth.currentAuthenticatedUser()
      .then(setLoggedInUser)
      .catch(() => null)
  }, [])

  return (
    <div className="flex">
      <nav className="fixed top-0 right-0 left-0 z-50 flex items-center bg-blue-700 px-4 py-2 text-white">
        {loggedInUser ? (
          <LoggedInBar loggedInUser={loggedInUser} navMenuOpen={navMenuOpen} openMenu={openMenu} />
        ) : (
          <LoggedOutBar />
        )}
      </nav>
      {renderChildren()}
    </div>
  )
}

export default Authenticated
