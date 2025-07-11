import '@aws-amplify/ui-react/styles.css'
import { Auth } from 'aws-amplify'
import React, { useEffect, useState } from 'react'

import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'
import Toolbar from '@mui/material/Toolbar'

import EmailsAuthenticator from './emails-authenticator'
import IconDrawer from './icon-drawer'
import LoggedInBar from './logged-in-bar'
import LoggedOutBar from './logged-out-bar'
import { AmplifyUser } from '@types'

const drawerWidth = parseInt(process.env.GATSBY_DRAWER_WIDTH, 10)

interface AppBarProps extends MuiAppBarProps {
  open?: boolean
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  transition: theme.transitions.create(['width', 'margin'], {
    duration: theme.transitions.duration.leavingScreen,
    easing: theme.transitions.easing.sharp,
  }),
  zIndex: theme.zIndex.drawer + 1,
  ...(open && {
    marginLeft: drawerWidth,
    transition: theme.transitions.create(['width', 'margin'], {
      duration: theme.transitions.duration.enteringScreen,
      easing: theme.transitions.easing.sharp,
    }),
    width: `calc(100% - ${drawerWidth}px)`,
  }),
}))

export interface AuthenticatedProps {
  children: JSX.Element | JSX.Element[]
  showContent?: boolean
}

const Authenticated = ({ children, showContent = false }: AuthenticatedProps): JSX.Element => {
  const [loggedInUser, setLoggedInUser] = useState<AmplifyUser | undefined>()
  const [navMenuOpen, setNavMenuOpen] = useState(false)

  const closeMenu = (): void => {
    setNavMenuOpen(false)
  }

  const openMenu = (): void => {
    setNavMenuOpen(true)
  }

  const renderChildren = (): JSX.Element[] | JSX.Element => {
    if (loggedInUser) {
      return (
        <IconDrawer
          closeMenu={closeMenu}
          loggedInUser={loggedInUser}
          navMenuOpen={navMenuOpen}
          openMenu={openMenu}
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

  // Set user if already logged in
  useEffect(() => {
    Auth.currentAuthenticatedUser()
      .then(setLoggedInUser)
      .catch(() => null)
  }, [])

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar open={navMenuOpen} position="fixed">
        <Toolbar>
          {loggedInUser ? (
            <LoggedInBar loggedInUser={loggedInUser} navMenuOpen={navMenuOpen} openMenu={openMenu} />
          ) : (
            <LoggedOutBar />
          )}
        </Toolbar>
      </AppBar>
      {renderChildren()}
    </Box>
  )
}

export default Authenticated
