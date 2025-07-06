import { HeadFC, navigate } from 'gatsby'
import React from 'react'

import Authenticated from '@components/auth'
import PrivacyLink from '@components/privacy-link'

const Index = (): JSX.Element => {
  return (
    <main style={{ height: '100%' }}>
      <Authenticated>{(typeof window !== 'undefined' && navigate('/inbox')) || <></>}</Authenticated>
      <PrivacyLink />
    </main>
  )
}

export const Head: HeadFC = () => <title>Email | dbowland.com</title>

export default Index
