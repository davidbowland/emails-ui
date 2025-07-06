import { HeadFC } from 'gatsby'
import React from 'react'

import Paper from '@mui/material/Paper'

import Authenticated from '@components/auth'
import PrivacyPolicy from '@components/privacy-policy'
import '@config/amplify'

const PrivacyPage = (): JSX.Element => {
  return (
    <>
      <main>
        <Authenticated showContent={true}>
          <Paper elevation={3} sx={{ margin: 'auto', maxWidth: '900px' }}>
            <PrivacyPolicy />
          </Paper>
        </Authenticated>
      </main>
    </>
  )
}

export const Head: HeadFC = () => <title>Privacy Policy | dbowland.com</title>

export default PrivacyPage
