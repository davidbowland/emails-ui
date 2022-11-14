import { Authenticator, ThemeProvider, defaultDarkModeOverride } from '@aws-amplify/ui-react'
import { AmplifyUser } from '@aws-amplify/ui'
import React from 'react'
import Stack from '@mui/material/Stack'

export interface EmailsAuthenticatorProps {
  setLoggedInUser: (user: AmplifyUser | undefined) => void
}

const EmailsAuthenticator = ({ setLoggedInUser }: EmailsAuthenticatorProps): JSX.Element => {
  const theme = {
    name: 'dark-mode-theme',
    overrides: [defaultDarkModeOverride],
  }

  return (
    <main style={{ padding: '50px' }}>
      <section>
        <ThemeProvider colorMode="system" theme={theme}>
          <Stack margin="auto" spacing={2}>
            <Authenticator hideSignUp={true}>
              {({ user }) => {
                setLoggedInUser(user)
                return <></>
              }}
            </Authenticator>
          </Stack>
        </ThemeProvider>
      </section>
    </main>
  )
}

export default EmailsAuthenticator
