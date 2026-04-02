import Link from 'next/link'
import React from 'react'

import MenuIcon from '@mui/icons-material/Menu'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'

import { AmplifyUser } from '@types'

export interface LoggedInBarProps {
  loggedInUser: AmplifyUser
  navMenuOpen: boolean
  openMenu: () => void
}

const LoggedInBar = ({ loggedInUser, navMenuOpen, openMenu }: LoggedInBarProps): React.ReactNode => {
  return (
    <>
      <IconButton
        aria-label="Open navigation menu"
        edge="start"
        onClick={openMenu}
        sx={{
          marginRight: 5,
          ...(navMenuOpen && { display: 'none' }),
        }}
      >
        <MenuIcon />
      </IconButton>
      <Typography sx={{ flexGrow: 1 }} variant="h6">
        <Link href="/" style={{ color: '#fff', textDecoration: 'none' }}>
          Email
        </Link>
      </Typography>
      <Typography component="div">{loggedInUser.username}</Typography>
    </>
  )
}

export default LoggedInBar
