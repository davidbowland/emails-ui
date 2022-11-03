import Grid from '@mui/material/Grid'
import { Helmet } from 'react-helmet'
import { Link } from 'gatsby'
import React from 'react'
import Typography from '@mui/material/Typography'

import PrivacyLink from '@components/privacy-link'
export interface ServerErrorProps {
  children: React.ReactNode
  title: string
}

const ServerErrorMessage = ({ children, title }: ServerErrorProps): JSX.Element => {
  return (
    <>
      <Helmet>
        <title>{title} -- dbowland.com</title>
      </Helmet>
      <Grid container justifyContent="center">
        <Grid container direction="column" item padding={4} spacing={2} sx={{ maxWidth: '900px' }}>
          <Grid item xs>
            <Typography variant="h1">{title}</Typography>
          </Grid>
          <Grid item xs>
            {children}
          </Grid>
          <Grid item xs>
            <Link to="/">Go home</Link>
            <PrivacyLink />
          </Grid>
        </Grid>
      </Grid>
    </>
  )
}

export default ServerErrorMessage
