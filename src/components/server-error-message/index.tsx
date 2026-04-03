import Link from 'next/link'
import React from 'react'

import PrivacyLink from '@components/privacy-link'

export interface ServerErrorProps {
  children: React.ReactNode
  title: string
}

const ServerErrorMessage = ({ children, title }: ServerErrorProps): React.ReactNode => {
  return (
    <div className="flex justify-center">
      <div className="flex max-w-[900px] flex-col gap-4 p-4">
        <h1 className="text-6xl font-light">{title}</h1>
        <div>{children}</div>
        <div>
          <Link href="/">Go home</Link>
          <PrivacyLink />
        </div>
      </div>
    </div>
  )
}

export default ServerErrorMessage
