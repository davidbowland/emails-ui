import Link from 'next/link'
import React from 'react'

import Typography from '@mui/material/Typography'

const LoggedOutBar = (): React.ReactNode => {
  return (
    <Typography sx={{ flexGrow: 1 }} variant="h6">
      <Link href="/" style={{ color: '#fff', textDecoration: 'none' }}>
        Email
      </Link>
    </Typography>
  )
}

export default LoggedOutBar
