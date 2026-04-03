import Link from 'next/link'
import React from 'react'

const LoggedOutBar = (): React.ReactNode => {
  return (
    <h6 className="flex-1 text-xl font-medium">
      <Link href="/" style={{ color: '#fff', textDecoration: 'none' }}>
        Email
      </Link>
    </h6>
  )
}

export default LoggedOutBar
