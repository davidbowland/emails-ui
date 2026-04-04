import Head from 'next/head'
import React from 'react'

import Authenticated from '@components/auth'
import Compose from '@components/compose'

const ComposePage = (): React.ReactNode => {
  return (
    <>
      <Head>
        <title>Email | dbowland.com</title>
      </Head>
      <div style={{ height: '100%', overflow: 'hidden' }}>
        <Authenticated>
          <div className="h-full overflow-hidden" style={{ background: 'var(--paper-bg)', color: 'var(--text-paper)' }}>
            <Compose />
          </div>
        </Authenticated>
      </div>
    </>
  )
}

export default ComposePage
