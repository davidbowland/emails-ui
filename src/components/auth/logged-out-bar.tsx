import { Link } from 'gatsby'
import React from 'react'

import Typography from '@mui/material/Typography'

const LoggedOutBar = (): JSX.Element => {
  return (
    <Typography sx={{ flexGrow: 1 }} variant="h6">
      <Link style={{ color: '#fff', textDecoration: 'none' }} to="/">
        Email
      </Link>
    </Typography>
  )
}

export default LoggedOutBar
