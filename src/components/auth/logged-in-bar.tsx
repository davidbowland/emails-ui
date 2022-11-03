import React, { useState } from 'react'
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded'
import Alert from '@mui/material/Alert'
import { Auth } from 'aws-amplify'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import DeleteIcon from '@mui/icons-material/Delete'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import { Link } from 'gatsby'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import LogoutIcon from '@mui/icons-material/Logout'
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip'
import Snackbar from '@mui/material/Snackbar'
import SwipeableDrawer from '@mui/material/SwipeableDrawer'
import Typography from '@mui/material/Typography'

import { AmplifyUser } from '@types'

export interface LoggedInBarProps {
  loggedInUser: AmplifyUser
  setLoggedInUser: (user: AmplifyUser | undefined) => void
}

const LoggedInBar = ({ loggedInUser, setLoggedInUser }: LoggedInBarProps): JSX.Element => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDeleteErrorSnackbar, setShowDeleteErrorSnackbar] = useState(false)

  const closeMenu = (): void => {
    setIsDrawerOpen(false)
  }

  const deleteAccountClick = async (): Promise<void> => {
    setShowDeleteDialog(false)
    loggedInUser.deleteUser((err: any) => {
      if (err) {
        console.error('deleteAccountClick', err)
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

  const openMenu = (): void => {
    setIsDrawerOpen(true)
  }

  const snackbarClose = (): void => {
    setShowDeleteErrorSnackbar(false)
  }

  return (
    <>
      <Typography sx={{ flexGrow: 1 }} variant="h6">
        <Link style={{ color: '#fff', textDecoration: 'none' }} to="/">
          Email
        </Link>
      </Typography>
      <Typography component="div">{loggedInUser.username}</Typography>
      <IconButton
        aria-controls="menu-appbar"
        aria-haspopup="true"
        aria-label="menu"
        color="inherit"
        edge="start"
        onClick={openMenu}
        size="large"
        sx={{ ml: 0.5 }}
      >
        <AccountCircleRoundedIcon />
      </IconButton>
      <SwipeableDrawer anchor="right" onClose={closeMenu} onOpen={openMenu} open={isDrawerOpen}>
        <Box onClick={closeMenu} role="presentation" sx={{ width: 250 }}>
          <List>
            <ListItem button component="a" href="/privacy-policy">
              <ListItemIcon>
                <PrivacyTipIcon />
              </ListItemIcon>
              <ListItemText primary="Privacy policy" />
            </ListItem>
            <ListItem
              button
              onClick={() => {
                closeMenu()
                setLoggedInUser(undefined)
                Auth.signOut().then(() => window.location.reload())
              }}
            >
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Sign out" />
            </ListItem>
          </List>
          <Divider />
          <List>
            <ListItem button>
              <ListItemIcon>
                <CloseRoundedIcon />
              </ListItemIcon>
              <ListItemText primary="Close" />
            </ListItem>
          </List>
          <Divider />
          <List>
            <ListItem button onClick={() => setShowDeleteDialog(true)}>
              <ListItemIcon>
                <DeleteIcon />
              </ListItemIcon>
              <ListItemText primary="Delete account" />
            </ListItem>
          </List>
        </Box>
      </SwipeableDrawer>
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

export default LoggedInBar
