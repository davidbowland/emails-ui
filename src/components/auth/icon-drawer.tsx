import '@aws-amplify/ui-react/styles.css'
import { Auth } from 'aws-amplify'
import { ChevronLeft, LogOut, Mail, Menu, Pencil, Send, Settings, Shield, Trash2 } from 'lucide-react'
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
  openMenu: () => void
  setLoggedInUser: (user?: AmplifyUser) => void
}

const navItems = [
  { icon: <Pencil size={18} />, label: 'Compose', path: '/compose' },
  { icon: <Mail size={18} />, label: 'Inbox', path: '/inbox' },
  { icon: <Send size={18} />, label: 'Sent', path: '/outbox' },
]

const settingsItems = [
  { icon: <Settings size={18} />, label: 'Settings', path: '/settings' },
  { icon: <Shield size={18} />, label: 'Privacy policy', path: '/privacy-policy' },
]

const IconDrawer = ({
  children,
  closeMenu,
  loggedInUser,
  navMenuOpen,
  openMenu,
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
        Auth.signOut({ global: true }).then(() => (window.location.href = '/'))
      }
    })
  }

  const isActive = (path: string): boolean => Boolean(pathname.match(new RegExp(`${path}/?$`)))

  const sidebarWidth = navMenuOpen ? 'var(--sidebar-expanded)' : 'var(--sidebar-collapsed)'

  const renderNavItem = (
    item: { icon: React.ReactNode; label: string; path: string },
    index: number,
  ): React.ReactNode => {
    const active = isActive(item.path)
    return (
      <li key={index}>
        <button
          className="group relative flex w-full items-center gap-3 py-2.5 transition-colors"
          onClick={() => router.push(item.path)}
          style={{
            padding: navMenuOpen ? '10px 16px' : '10px 0',
            justifyContent: navMenuOpen ? 'flex-start' : 'center',
            borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
            background: active ? 'var(--accent-subtle)' : 'transparent',
            color: active ? 'var(--accent)' : 'var(--text-muted)',
            cursor: 'pointer',
          }}
          title={navMenuOpen ? undefined : item.label}
        >
          <span
            className="flex-shrink-0 transition-colors"
            style={{
              marginLeft: navMenuOpen ? '0' : 'auto',
              marginRight: navMenuOpen ? '0' : 'auto',
              color: active ? 'var(--accent)' : 'var(--text-muted)',
            }}
          >
            {item.icon}
          </span>
          <span
            className="overflow-hidden whitespace-nowrap text-sm font-medium transition-all"
            style={{
              maxWidth: navMenuOpen ? '160px' : '0',
              opacity: navMenuOpen ? 1 : 0,
              fontFamily: 'Outfit, sans-serif',
              letterSpacing: '0.01em',
            }}
          >
            {item.label}
          </span>
        </button>
      </li>
    )
  }

  const renderDangerItem = (
    icon: React.ReactNode,
    label: string,
    onClick: () => void,
    index: number,
  ): React.ReactNode => (
    <li key={index}>
      <button
        className="group flex w-full items-center gap-3 py-2.5 transition-colors"
        onClick={onClick}
        style={{
          padding: navMenuOpen ? '10px 16px' : '10px 0',
          justifyContent: navMenuOpen ? 'flex-start' : 'center',
          color: 'var(--text-muted)',
          borderLeft: '2px solid transparent',
          cursor: 'pointer',
        }}
        title={navMenuOpen ? undefined : label}
      >
        <span
          className="flex-shrink-0 transition-colors"
          style={{
            marginLeft: navMenuOpen ? '0' : 'auto',
            marginRight: navMenuOpen ? '0' : 'auto',
          }}
        >
          {icon}
        </span>
        <span
          className="overflow-hidden whitespace-nowrap text-sm transition-all"
          style={{
            maxWidth: navMenuOpen ? '160px' : '0',
            opacity: navMenuOpen ? 1 : 0,
            fontFamily: 'Outfit, sans-serif',
          }}
        >
          {label}
        </span>
      </button>
    </li>
  )

  return (
    <>
      {/* Sidebar */}
      <aside
        className="relative flex h-full flex-shrink-0 flex-col overflow-hidden transition-all duration-300"
        style={{
          width: sidebarWidth,
          background: 'var(--shell-bg)',
          borderRight: '1px solid var(--shell-border)',
          zIndex: 20,
        }}
      >
        {/* Top: toggle + logo */}
        <div
          className="flex h-14 flex-shrink-0 items-center"
          style={{
            borderBottom: '1px solid var(--shell-border)',
            padding: navMenuOpen ? '0 12px 0 16px' : '0',
            justifyContent: navMenuOpen ? 'space-between' : 'center',
          }}
        >
          {navMenuOpen ? (
            <>
              <span
                className="font-display text-base tracking-tight"
                style={{ color: 'var(--accent)', fontWeight: 700 }}
              >
                Email
              </span>
              <button
                aria-label="Close navigation menu"
                className="rounded p-1.5 transition-colors"
                onClick={closeMenu}
                style={{ color: 'var(--text-muted)' }}
              >
                <ChevronLeft size={16} />
              </button>
            </>
          ) : (
            <button
              aria-label="Open navigation menu"
              className="rounded p-1.5 transition-colors"
              onClick={openMenu}
              style={{ color: 'var(--text-muted)' }}
            >
              <Menu size={18} />
            </button>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2">
          <ul className="list-none p-0 m-0">{navItems.map(renderNavItem)}</ul>

          <div className="my-2 mx-3" style={{ height: '1px', background: 'var(--shell-border)' }} />

          <ul className="list-none p-0 m-0">{settingsItems.map(renderNavItem)}</ul>
        </nav>

        {/* Bottom: user + sign out */}
        <div style={{ borderTop: '1px solid var(--shell-border)' }}>
          <ul className="list-none p-0 m-0">
            {renderDangerItem(
              <LogOut size={18} />,
              'Sign out',
              () => {
                closeMenu()
                setLoggedInUser(undefined)
                Auth.signOut().then(() => (window.location.href = '/'))
              },
              0,
            )}
            {renderDangerItem(<Trash2 size={18} />, 'Delete account', () => setShowDeleteDialog(true), 1)}
          </ul>

          {/* User avatar / name */}
          <div
            className="flex items-center gap-2 overflow-hidden transition-all"
            style={{
              padding: navMenuOpen ? '10px 16px' : '10px 0',
              justifyContent: navMenuOpen ? 'flex-start' : 'center',
              borderTop: '1px solid var(--shell-border)',
            }}
          >
            <div
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold"
              style={{
                background: 'var(--accent-subtle)',
                border: '1px solid var(--accent-border)',
                color: 'var(--accent)',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              {loggedInUser.username?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <span
              className="overflow-hidden whitespace-nowrap text-xs transition-all"
              style={{
                maxWidth: navMenuOpen ? '160px' : '0',
                opacity: navMenuOpen ? 1 : 0,
                color: 'var(--text-muted)',
                fontFamily: 'IBM Plex Mono, monospace',
              }}
            >
              {loggedInUser.username}
            </span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex h-full flex-1 overflow-hidden">{children}</div>

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
