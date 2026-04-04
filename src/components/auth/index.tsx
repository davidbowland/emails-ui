import '@aws-amplify/ui-react/styles.css'
import { Auth } from 'aws-amplify'
import React, { useEffect, useState } from 'react'

import EmailsAuthenticator from './emails-authenticator'
import IconDrawer from './icon-drawer'
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

  useEffect(() => {
    Auth.currentAuthenticatedUser()
      .then(setLoggedInUser)
      .catch(() => null)
  }, [])

  if (loggedInUser) {
    return (
      <div className="flex h-full overflow-hidden">
        <IconDrawer
          closeMenu={closeMenu}
          loggedInUser={loggedInUser}
          navMenuOpen={navMenuOpen}
          openMenu={openMenu}
          setLoggedInUser={setLoggedInUser}
        >
          {children}
        </IconDrawer>
      </div>
    )
  }

  if (showContent) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <header
          className="flex flex-shrink-0 items-center px-6 py-4"
          style={{ borderBottom: '1px solid var(--shell-border)' }}
        >
          <span className="font-display text-xl tracking-tight" style={{ color: 'var(--accent)', fontWeight: 700 }}>
            Email
          </span>
        </header>
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="mb-8 text-center">
        <div className="mb-2 font-display text-3xl tracking-tight" style={{ color: 'var(--accent)', fontWeight: 700 }}>
          Email
        </div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Sign in to continue
        </p>
      </div>
      <EmailsAuthenticator setLoggedInUser={setLoggedInUser} />
    </div>
  )
}

export default Authenticated
