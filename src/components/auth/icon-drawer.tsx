import '@aws-amplify/ui-react/styles.css'
import { Auth } from 'aws-amplify'
import { navigate } from 'gatsby'
import React, { useState } from 'react'

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import CreateIcon from '@mui/icons-material/Create'
import DeleteIcon from '@mui/icons-material/Delete'
import LogoutIcon from '@mui/icons-material/Logout'
import InboxIcon from '@mui/icons-material/MoveToInbox'
import OutboxIcon from '@mui/icons-material/Outbox'
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip'
import SettingsIcon from '@mui/icons-material/Settings'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Snackbar from '@mui/material/Snackbar'
import { CSSObject, styled, Theme } from '@mui/material/styles'
import MuiDrawer from '@mui/material/SwipeableDrawer'
import Tooltip from '@mui/material/Tooltip'

import { AmplifyUser } from '@types'

const drawerWidth = parseInt(process.env.GATSBY_DRAWER_WIDTH, 10)

const openedMixin = (theme: Theme): CSSObject => ({
  overflowX: 'hidden',
  transition: theme.transitions.create('width', {
    duration: theme.transitions.duration.enteringScreen,
    easing: theme.transitions.easing.sharp,
  }),
  width: drawerWidth,
})

const closedMixin = (theme: Theme): CSSObject => ({
  overflowX: 'hidden',
  transition: theme.transitions.create('width', {
    duration: theme.transitions.duration.leavingScreen,
    easing: theme.transitions.easing.sharp,
  }),
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
})

const DrawerHeader = styled('div')(({ theme }) => ({
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}))

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(({ theme, open }) => ({
  boxSizing: 'border-box',
  flexShrink: 0,
  whiteSpace: 'nowrap',
  width: drawerWidth,
  ...(open && {
    ...openedMixin(theme),
    '& .MuiDrawer-paper': openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
    '& .MuiDrawer-paper': closedMixin(theme),
  }),
}))

export interface IconDrawerProps {
  children: JSX.Element | JSX.Element[]
  closeMenu: () => void
  loggedInUser: AmplifyUser
  navMenuOpen: boolean
  openMenu: () => void
  setLoggedInUser: (user?: AmplifyUser) => void
}

const IconDrawer = ({
  children,
  closeMenu,
  loggedInUser,
  navMenuOpen,
  openMenu,
  setLoggedInUser,
}: IconDrawerProps): JSX.Element => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDeleteErrorSnackbar, setShowDeleteErrorSnackbar] = useState(false)

  const deleteAccountClick = async (): Promise<void> => {
    setShowDeleteDialog(false)
    loggedInUser.deleteUser((error: any) => {
      if (error) {
        console.error('deleteAccountClick', { error, username: loggedInUser.username })
        setShowDeleteErrorSnackbar(true)
      } else {
        closeMenu()
        setLoggedInUser(undefined)
        Auth.signOut({ global: true }).then(() => window.location.reload())
      }
    })
  }

  const deleteDialogClose = (): void => {
    setShowDeleteDialog(false)
  }

  const snackbarClose = (): void => {
    setShowDeleteErrorSnackbar(false)
  }

  const pathname = (typeof window !== 'undefined' && window.location.pathname) || ''
  return (
    <>
      <Drawer onClose={closeMenu} onOpen={openMenu} open={navMenuOpen} variant="permanent">
        <DrawerHeader>
          <IconButton aria-label="Close navigation menu" onClick={closeMenu}>
            <ChevronLeftIcon />
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              onClick={() => navigate('/compose')}
              selected={!!pathname.match(/\/compose\/?$/)}
              sx={{
                justifyContent: navMenuOpen ? 'initial' : 'center',
                minHeight: 48,
                px: 2.5,
              }}
            >
              <Tooltip placement="right" title="Compose">
                <ListItemIcon
                  sx={{
                    justifyContent: 'center',
                    minWidth: 0,
                    mr: navMenuOpen ? 3 : 'auto',
                  }}
                >
                  <CreateIcon />
                </ListItemIcon>
              </Tooltip>
              <ListItemText primary="Compose" sx={{ opacity: navMenuOpen ? 1 : 0 }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              onClick={() => navigate('/inbox')}
              selected={!!pathname.match(/\/inbox\/?$/)}
              sx={{
                justifyContent: navMenuOpen ? 'initial' : 'center',
                minHeight: 48,
                px: 2.5,
              }}
            >
              <Tooltip placement="right" title="Inbox">
                <ListItemIcon
                  sx={{
                    justifyContent: 'center',
                    minWidth: 0,
                    mr: navMenuOpen ? 3 : 'auto',
                  }}
                >
                  <InboxIcon />
                </ListItemIcon>
              </Tooltip>
              <ListItemText primary="Inbox" sx={{ opacity: navMenuOpen ? 1 : 0 }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              onClick={() => navigate('/outbox')}
              selected={!!pathname.match(/\/outbox\/?$/)}
              sx={{
                justifyContent: navMenuOpen ? 'initial' : 'center',
                minHeight: 48,
                px: 2.5,
              }}
            >
              <Tooltip placement="right" title="Sent">
                <ListItemIcon
                  sx={{
                    justifyContent: 'center',
                    minWidth: 0,
                    mr: navMenuOpen ? 3 : 'auto',
                  }}
                >
                  <OutboxIcon />
                </ListItemIcon>
              </Tooltip>
              <ListItemText primary="Sent" sx={{ opacity: navMenuOpen ? 1 : 0 }} />
            </ListItemButton>
          </ListItem>
        </List>
        <Divider />
        <List>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              onClick={() => navigate('/settings')}
              selected={!!pathname.match(/\/settings\/?$/)}
              sx={{
                justifyContent: navMenuOpen ? 'initial' : 'center',
                minHeight: 48,
                px: 2.5,
              }}
            >
              <Tooltip placement="right" title="Settings">
                <ListItemIcon
                  sx={{
                    justifyContent: 'center',
                    minWidth: 0,
                    mr: navMenuOpen ? 3 : 'auto',
                  }}
                >
                  <SettingsIcon />
                </ListItemIcon>
              </Tooltip>
              <ListItemText primary="Settings" sx={{ opacity: navMenuOpen ? 1 : 0 }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              onClick={() => navigate('/privacy-policy')}
              selected={!!pathname.match(/\/privacy-policy\/?$/)}
              sx={{
                justifyContent: navMenuOpen ? 'initial' : 'center',
                minHeight: 48,
                px: 2.5,
              }}
            >
              <Tooltip placement="right" title="Privacy policy">
                <ListItemIcon
                  sx={{
                    justifyContent: 'center',
                    minWidth: 0,
                    mr: navMenuOpen ? 3 : 'auto',
                  }}
                >
                  <PrivacyTipIcon />
                </ListItemIcon>
              </Tooltip>
              <ListItemText primary="Privacy policy" sx={{ opacity: navMenuOpen ? 1 : 0 }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              onClick={() => {
                closeMenu()
                setLoggedInUser(undefined)
                Auth.signOut().then(() => window.location.reload())
              }}
              sx={{
                justifyContent: navMenuOpen ? 'initial' : 'center',
                minHeight: 48,
                px: 2.5,
              }}
            >
              <Tooltip placement="right" title="Sign out">
                <ListItemIcon
                  sx={{
                    justifyContent: 'center',
                    minWidth: 0,
                    mr: navMenuOpen ? 3 : 'auto',
                  }}
                >
                  <LogoutIcon />
                </ListItemIcon>
              </Tooltip>
              <ListItemText primary="Sign out" sx={{ opacity: navMenuOpen ? 1 : 0 }} />
            </ListItemButton>
          </ListItem>
        </List>
        <Divider />
        <List>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              onClick={() => setShowDeleteDialog(true)}
              sx={{
                justifyContent: navMenuOpen ? 'initial' : 'center',
                minHeight: 48,
                px: 2.5,
              }}
            >
              <Tooltip placement="right" title="Delete account">
                <ListItemIcon
                  sx={{
                    justifyContent: 'center',
                    minWidth: 0,
                    mr: navMenuOpen ? 3 : 'auto',
                  }}
                >
                  <DeleteIcon />
                </ListItemIcon>
              </Tooltip>
              <ListItemText primary="Delete account" sx={{ opacity: navMenuOpen ? 1 : 0 }} />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <DrawerHeader />
        {children}
      </Box>
      <Dialog
        aria-describedby="Are you sure you want to delete the account?"
        aria-labelledby="Delete account dialog"
        onClose={deleteDialogClose}
        open={showDeleteDialog}
      >
        <DialogTitle id="alert-dialog-title">Delete account?</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete your account? Some information may remain in log files for up to 90 days.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={deleteDialogClose}>
            Go back
          </Button>
          <Button onClick={deleteAccountClick}>Continue</Button>
        </DialogActions>
      </Dialog>
      <Snackbar autoHideDuration={6000} onClose={snackbarClose} open={showDeleteErrorSnackbar}>
        <Alert onClose={snackbarClose} severity="error" sx={{ width: '100%' }} variant="filled">
          There was a problem deleting your account. Please try again later.
        </Alert>
      </Snackbar>
    </>
  )
}

export default IconDrawer
