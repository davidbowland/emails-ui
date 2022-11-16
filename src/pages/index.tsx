import { Helmet } from 'react-helmet'
import React from 'react'

import Authenticated from '@components/auth'
import PrivacyLink from '@components/privacy-link'
import { navigate } from 'gatsby'

const Index = (): JSX.Element => {
  return (
    <main style={{ height: '100%' }}>
      <Helmet>
        <title>Email | dbowland.com</title>
      </Helmet>
      <Authenticated>
        <>{typeof window !== 'undefined' && navigate('/inbox')}</>
      </Authenticated>
      <PrivacyLink />
    </main>
  )
}

export default Index
