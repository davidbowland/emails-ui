import { Authenticator, ThemeProvider, defaultDarkModeOverride } from '@aws-amplify/ui-react'
import { AmplifyUser } from '@types'
import Grid from '@mui/material/Grid'
import React from 'react'

export interface EmailsAuthenticatorProps {
  setLoggedInUser: (user: AmplifyUser | undefined) => void
}

const EmailsAuthenticator = ({ setLoggedInUser }: EmailsAuthenticatorProps): JSX.Element => {
  const theme = {
    name: 'dark-mode-theme',
    overrides: [defaultDarkModeOverride],
  }

  return (
    <Grid alignContent="center" container paddingLeft={2} paddingRight={2} paddingTop={10} spacing={2} width="100%">
      <Grid item margin="auto" xs="auto">
        <ThemeProvider colorMode="system" theme={theme}>
          <Authenticator hideSignUp={true}>
            {({ user }) => {
              setLoggedInUser(user)
              return <></>
            }}
          </Authenticator>
        </ThemeProvider>
      </Grid>
    </Grid>
  )
}

export default EmailsAuthenticator
