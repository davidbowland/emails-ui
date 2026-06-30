import '@aws-amplify/ui-react/styles.css'
import { Auth } from 'aws-amplify'
import { LogOut, Mail, Menu, Pencil, Send, Settings, Shield, Trash2, X } from 'lucide-react'
import { useRouter } from 'next/router'
import React, { useEffect, useRef, useState } from 'react'

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
  { icon: <Pencil size={16} strokeWidth={1.5} />, label: 'Compose', path: '/compose' },
  { icon: <Mail size={16} strokeWidth={1.5} />, label: 'Inbox', path: '/inbox' },
  { icon: <Send size={16} strokeWidth={1.5} />, label: 'Sent', path: '/outbox' },
]

const settingsItems = [
  { icon: <Settings size={16} strokeWidth={1.5} />, label: 'Settings', path: '/settings' },
  { icon: <Shield size={16} strokeWidth={1.5} />, label: 'Privacy policy', path: '/privacy-policy' },
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
  const sidebarRef = useRef<HTMLElement>(null)

  useEffect(() => {
    setPathname(window.location.pathname)
  }, [router.asPath])

  useEffect(() => {
    if (!navMenuOpen) return
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        closeMenu()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = Array.from(
        sidebarRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [navMenuOpen, closeMenu])

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

  const renderNavItem = (
    item: { icon: React.ReactNode; label: string; path: string },
    index: number,
    staggerDelay: number,
  ): React.ReactNode => {
    const active = isActive(item.path)
    return (
      <li key={index}>
        <button
          className="group relative flex w-full items-center gap-3"
          onClick={() => {
            router.push(item.path)
            closeMenu()
          }}
          style={{
            padding: navMenuOpen ? '11px 16px' : '11px 0',
            justifyContent: navMenuOpen ? 'flex-start' : 'center',
            background: active
              ? 'linear-gradient(90deg, rgba(124,93,244,0.15) 0%, rgba(124,93,244,0.04) 100%)'
              : 'transparent',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'background 0.2s cubic-bezier(0.32,0.72,0,1)',
            ...(navMenuOpen
              ? {
                opacity: 0,
                animation: `slideInLeft 0.3s cubic-bezier(0.32,0.72,0,1) ${staggerDelay}ms forwards`,
              }
              : {}),
          }}
          title={navMenuOpen ? undefined : item.label}
        >
          {/* Icon container */}
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: active ? 'var(--accent-subtle)' : 'transparent',
              border: active ? '1px solid var(--accent-border)' : '1px solid transparent',
              color: active ? 'var(--accent)' : 'var(--text-muted)',
              transition: 'all 0.2s cubic-bezier(0.32,0.72,0,1)',
              marginLeft: navMenuOpen ? '0' : 'auto',
              marginRight: navMenuOpen ? '0' : 'auto',
              boxShadow: active ? 'var(--glow-accent-sm)' : 'none',
            }}
          >
            {item.icon}
          </div>

          {/* Label */}
          <span
            style={{
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              maxWidth: navMenuOpen ? '160px' : '0',
              opacity: navMenuOpen ? 1 : 0,
              fontFamily: 'Outfit, sans-serif',
              fontSize: '14px',
              fontWeight: active ? 600 : 400,
              letterSpacing: '0.01em',
              color: active ? 'var(--accent)' : 'var(--text-primary)',
              transition: 'max-width 0.25s cubic-bezier(0.32,0.72,0,1), opacity 0.2s ease',
            }}
          >
            {item.label}
          </span>

          {/* Active dot indicator (collapsed) */}
          {active && !navMenuOpen && (
            <div
              style={{
                position: 'absolute',
                right: '8px',
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: 'var(--accent)',
                boxShadow: '0 0 6px var(--accent)',
              }}
            />
          )}
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
        className="group flex w-full items-center gap-3"
        onClick={onClick}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--shell-surface-hover)')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
        style={{
          padding: navMenuOpen ? '10px 16px' : '10px 0',
          justifyContent: navMenuOpen ? 'flex-start' : 'center',
          borderRadius: '10px',
          cursor: 'pointer',
          transition: 'background 0.2s cubic-bezier(0.32,0.72,0,1)',
        }}
        title={navMenuOpen ? undefined : label}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: 'var(--text-muted)',
            marginLeft: navMenuOpen ? '0' : 'auto',
            marginRight: navMenuOpen ? '0' : 'auto',
          }}
        >
          {icon}
        </div>
        <span
          style={{
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            maxWidth: navMenuOpen ? '160px' : '0',
            opacity: navMenuOpen ? 1 : 0,
            fontFamily: 'Outfit, sans-serif',
            fontSize: '14px',
            color: 'var(--text-muted)',
            transition: 'max-width 0.25s cubic-bezier(0.32,0.72,0,1), opacity 0.2s ease',
          }}
        >
          {label}
        </span>
      </button>
    </li>
  )

  const sidebarWidth = navMenuOpen ? 'var(--sidebar-expanded)' : 'var(--sidebar-collapsed)'

  return (
    <>
      {/* Overlay backdrop when menu is open */}
      {navMenuOpen && (
        <div
          aria-label="Close navigation"
          onClick={closeMenu}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') closeMenu()
          }}
          role="button"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10,
            background: 'rgba(7, 8, 15, 0.6)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease forwards',
          }}
          tabIndex={0}
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        style={{
          position: navMenuOpen ? 'fixed' : 'relative',
          top: 0,
          left: 0,
          height: '100%',
          width: sidebarWidth,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 20,
          background: navMenuOpen
            ? 'linear-gradient(160deg, rgba(19, 21, 36, 0.98) 0%, rgba(12, 13, 26, 0.99) 100%)'
            : 'var(--shell-bg)',
          borderRight: '1px solid var(--shell-border)',
          backdropFilter: navMenuOpen ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: navMenuOpen ? 'blur(20px)' : 'none',
          boxShadow: navMenuOpen ? '4px 0 40px rgba(0,0,0,0.6), inset -1px 0 0 rgba(255,255,255,0.04)' : 'none',
          transition: 'width 0.3s cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        {/* Header: toggle + logo */}
        <div
          style={{
            height: '56px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            padding: navMenuOpen ? '0 12px 0 16px' : '0',
            justifyContent: navMenuOpen ? 'space-between' : 'center',
            borderBottom: '1px solid var(--shell-border)',
          }}
        >
          {navMenuOpen ? (
            <>
              {/* Brand when expanded */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, rgba(124,93,244,0.2) 0%, rgba(124,93,244,0.08) 100%)',
                    border: '1px solid var(--accent-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--glow-accent-sm)',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'Libre Baskerville, serif',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--accent)',
                      lineHeight: 1,
                    }}
                  >
                    E
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: 'Libre Baskerville, serif',
                    fontSize: '15px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                    animation: 'fadeIn 0.2s ease forwards',
                  }}
                >
                  Email
                </span>
              </div>

              {/* Close button */}
              <button
                aria-label="Close navigation menu"
                onClick={closeMenu}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLElement).style.background = 'var(--shell-surface-hover)'
                  ;(e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'
                }}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease, color 0.15s ease',
                }}
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            </>
          ) : (
            /* Collapsed: hamburger → monogram toggle */
            <button
              aria-label="Open navigation menu"
              onClick={openMenu}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLElement).style.background = 'var(--shell-surface-hover)'
                ;(e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                ;(e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'
              }}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.15s ease, color 0.15s ease',
              }}
            >
              <Menu size={17} strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* Nav items */}
        <nav
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: navMenuOpen ? '12px 10px' : '12px 6px',
          }}
        >
          <ul
            style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}
          >
            {navItems.map((item, i) => renderNavItem(item, i, 80 + i * 50))}
          </ul>

          {/* Divider */}
          <div
            style={{
              margin: '10px 4px',
              height: '1px',
              background: 'var(--shell-border)',
            }}
          />

          <ul
            style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}
          >
            {settingsItems.map((item, i) => renderNavItem(item, navItems.length + i, 80 + (navItems.length + i) * 50))}
          </ul>
        </nav>

        {/* Footer: sign out, delete, user */}
        <div style={{ borderTop: '1px solid var(--shell-border)', padding: navMenuOpen ? '8px 10px' : '8px 6px' }}>
          <ul
            style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}
          >
            {renderDangerItem(
              <LogOut size={16} strokeWidth={1.5} />,
              'Sign out',
              () => {
                closeMenu()
                setLoggedInUser(undefined)
                Auth.signOut().then(() => (window.location.href = '/'))
              },
              0,
            )}
            {renderDangerItem(
              <Trash2 size={16} strokeWidth={1.5} />,
              'Delete account',
              () => setShowDeleteDialog(true),
              1,
            )}
          </ul>

          {/* User avatar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: navMenuOpen ? '10px 10px 4px' : '10px 0 4px',
              justifyContent: navMenuOpen ? 'flex-start' : 'center',
              borderTop: '1px solid var(--shell-border)',
              marginTop: '6px',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, rgba(124,93,244,0.2) 0%, rgba(124,93,244,0.06) 100%)',
                border: '1px solid var(--accent-border)',
                color: 'var(--accent)',
                fontFamily: 'Outfit, sans-serif',
                fontSize: '12px',
                fontWeight: 700,
                boxShadow: 'var(--glow-accent-sm)',
              }}
            >
              {loggedInUser.username?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <span
              style={{
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                maxWidth: navMenuOpen ? '160px' : '0',
                opacity: navMenuOpen ? 1 : 0,
                color: 'var(--text-muted)',
                fontFamily: 'IBM Plex Mono, monospace',
                fontSize: '11px',
                transition: 'max-width 0.25s cubic-bezier(0.32,0.72,0,1), opacity 0.2s ease',
              }}
            >
              {loggedInUser.username}
            </span>
          </div>
        </div>
      </aside>

      {/* Main content — pushed right when sidebar is not overlapping */}
      <div
        style={{
          flex: 1,
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          marginLeft: navMenuOpen ? 'var(--sidebar-collapsed)' : '0',
          transition: 'margin-left 0.3s cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        {children}
      </div>

      <ConfirmDialog
        cancelLabel="Go back"
        confirmLabel="Delete my account"
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={deleteAccountClick}
        open={showDeleteDialog}
        title="Delete account?"
      >
        Deleting your account is permanent. Basic server logs are kept for up to 90 days.
      </ConfirmDialog>
      <ErrorSnackbar
        message={showDeleteErrorSnackbar ? "Couldn't delete your account. Please try again." : undefined}
        onClose={() => setShowDeleteErrorSnackbar(false)}
      />
    </>
  )
}

export default IconDrawer
