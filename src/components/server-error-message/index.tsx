import Link from 'next/link'
import React from 'react'

import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

import PrivacyLink from '@components/privacy-link'

export interface ServerErrorProps {
  children: React.ReactNode
  title: string
}

const ServerErrorMessage = ({ children, title }: ServerErrorProps): React.ReactNode => {
  return (
    <>
      <Grid container justifyContent="center">
        <Grid container direction="column" item padding={4} spacing={2} sx={{ maxWidth: '900px' }}>
          <Grid item xs>
            <Typography variant="h1">{title}</Typography>
          </Grid>
          <Grid item xs>
            {children}
          </Grid>
          <Grid item xs>
            <Link href="/">Go home</Link>
            <PrivacyLink />
          </Grid>
        </Grid>
      </Grid>
    </>
  )
}

export default ServerErrorMessage
