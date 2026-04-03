import '@aws-amplify/ui-react/styles.css'
import { Auth } from 'aws-amplify'
import { ChevronLeft, LogOut, Mail, Pencil, Send, Settings, Shield, Trash2 } from 'lucide-react'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

import ConfirmDialog from '@components/confirm-dialog'
import ErrorSnackbar from '@components/error-snackbar'
import { AmplifyUser } from '@types'

export interface IconDrawerProps {
  children: React.ReactNode
  closeMenu: () => void
  loggedInUser: AmplifyUser
  navMenuOpen: boolean
  setLoggedInUser: (user?: AmplifyUser) => void
}

const navItems = [
  { icon: <Pencil size={20} />, label: 'Compose', path: '/compose' },
  { icon: <Mail size={20} />, label: 'Inbox', path: '/inbox' },
  { icon: <Send size={20} />, label: 'Sent', path: '/outbox' },
]

const settingsItems = [
  { icon: <Settings size={20} />, label: 'Settings', path: '/settings' },
  { icon: <Shield size={20} />, label: 'Privacy policy', path: '/privacy-policy' },
]

const IconDrawer = ({
  children,
  closeMenu,
  loggedInUser,
  navMenuOpen,
  setLoggedInUser,
}: IconDrawerProps): React.ReactNode => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDeleteErrorSnackbar, setShowDeleteErrorSnackbar] = useState(false)

  const router = useRouter()
  const [pathname, setPathname] = useState('')

  useEffect(() => {
    setPathname(window.location.pathname)
  }, [router.asPath])

  const deleteAccountClick = async (): Promise<void> => {
    setShowDeleteDialog(false)
    loggedInUser.deleteUser((error: any) => {
      if (error) {
        console.error('deleteAccountClick', { error, username: loggedInUser.username })
        setShowDeleteErrorSnackbar(true)
      } else {
        closeMenu()
        setLoggedInUser(undefined)
        Auth.signOut({ global: true }).then(() => window.location.reload())
      }
    })
  }

  const renderNavItem = (
    item: { icon: React.ReactNode; label: string; path: string },
    index: number,
  ): React.ReactNode => (
    <li key={index}>
      <button
        className={`flex w-full items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 ${
          pathname.match(new RegExp(`${item.path}/?$`)) ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
        onClick={() => router.push(item.path)}
      >
        {item.icon}
        <span className={navMenuOpen ? 'opacity-100' : 'opacity-0'}>{item.label}</span>
      </button>
    </li>
  )

  return (
    <>
      <div
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-white transition-all dark:bg-[#121212] ${navMenuOpen ? 'w-60' : 'w-14'}`}
      >
        <div className="flex h-16 items-center justify-end px-2">
          <button
            aria-label="Close navigation menu"
            className="rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={closeMenu}
          >
            <ChevronLeft size={20} />
          </button>
        </div>
        <hr />
        <ul className="list-none p-0">{navItems.map(renderNavItem)}</ul>
        <hr />
        <ul className="list-none p-0">
          {settingsItems.map(renderNavItem)}
          <li>
            <button
              className="flex w-full items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => {
                closeMenu()
                setLoggedInUser(undefined)
                Auth.signOut().then(() => window.location.reload())
              }}
            >
              <LogOut size={20} />
              <span className={navMenuOpen ? 'opacity-100' : 'opacity-0'}>Sign out</span>
            </button>
          </li>
        </ul>
        <hr />
        <ul className="list-none p-0">
          <li>
            <button
              className="flex w-full items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 size={20} />
              <span className={navMenuOpen ? 'opacity-100' : 'opacity-0'}>Delete account</span>
            </button>
          </li>
        </ul>
      </div>
      <main className={`flex-1 p-6 pt-20 transition-all ${navMenuOpen ? 'ml-60' : 'ml-14'}`}>{children}</main>
      <ConfirmDialog
        cancelLabel="Go back"
        confirmLabel="Continue"
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={deleteAccountClick}
        open={showDeleteDialog}
        title="Delete account?"
      >
        Are you sure you want to delete your account? Some information may remain in log files for up to 90 days.
      </ConfirmDialog>
      <ErrorSnackbar
        message={
          showDeleteErrorSnackbar ? 'There was a problem deleting your account. Please try again later.' : undefined
        }
        onClose={() => setShowDeleteErrorSnackbar(false)}
      />
    </>
  )
}

export default IconDrawer
