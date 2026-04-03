import { Authenticator, defaultDarkModeOverride, ThemeProvider } from '@aws-amplify/ui-react'
import React from 'react'

import { AmplifyUser } from '@types'

export interface EmailsAuthenticatorProps {
  setLoggedInUser: (user: AmplifyUser | undefined) => void
}

const EmailsAuthenticator = ({ setLoggedInUser }: EmailsAuthenticatorProps): React.ReactNode => {
  const theme = {
    name: 'dark-mode-theme',
    overrides: [defaultDarkModeOverride],
  }

  return (
    <div className="flex w-full items-center justify-center px-4 pt-10">
      <ThemeProvider colorMode="system" theme={theme}>
        <Authenticator hideSignUp={true}>
          {({ user }) => {
            setLoggedInUser(user)
            return <></>
          }}
        </Authenticator>
      </ThemeProvider>
    </div>
  )
}

export default EmailsAuthenticator
