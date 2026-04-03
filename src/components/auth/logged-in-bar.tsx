import { Menu } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { AmplifyUser } from '@types'

export interface LoggedInBarProps {
  loggedInUser: AmplifyUser
  navMenuOpen: boolean
  openMenu: () => void
}

const LoggedInBar = ({ loggedInUser, navMenuOpen, openMenu }: LoggedInBarProps): React.ReactNode => {
  return (
    <>
      <button
        aria-label="Open navigation menu"
        className={`mr-5 rounded p-1 hover:bg-white/10 ${navMenuOpen ? 'hidden' : ''}`}
        onClick={openMenu}
      >
        <Menu size={24} />
      </button>
      <h6 className="flex-1 text-xl font-medium">
        <Link href="/" style={{ color: '#fff', textDecoration: 'none' }}>
          Email
        </Link>
      </h6>
      <div>{loggedInUser.username}</div>
    </>
  )
}

export default LoggedInBar
