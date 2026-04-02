import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

import Authenticated from '@components/auth'
import PrivacyLink from '@components/privacy-link'

const Index = (): React.ReactNode => {
  const router = useRouter()
  const [redirected, setRedirected] = useState(false)

  useEffect(() => {
    if (!redirected) {
      setRedirected(true)
      router.replace('/inbox')
    }
  }, [])

  return (
    <>
      <Head>
        <title>Email | dbowland.com</title>
      </Head>
      <main style={{ height: '100%' }}>
        <Authenticated>
          <></>
        </Authenticated>
        <PrivacyLink />
      </main>
    </>
  )
}

export default Index
