import '@aws-amplify/ui-react/styles.css'
import { Auth } from 'aws-amplify'
import React, { useEffect, useState } from 'react'

import EmailsAuthenticator from './emails-authenticator'
import IconDrawer from './icon-drawer'
import { AmplifyUser } from '@types'

export interface AuthenticatedProps {
  children: React.ReactNode
  showContent?: boolean
}

const Authenticated = ({ children, showContent = false }: AuthenticatedProps): React.ReactNode => {
  const [loggedInUser, setLoggedInUser] = useState<AmplifyUser | undefined>()
  const [navMenuOpen, setNavMenuOpen] = useState(false)

  const closeMenu = (): void => {
    setNavMenuOpen(false)
  }

  const openMenu = (): void => {
    setNavMenuOpen(true)
  }

  useEffect(() => {
    Auth.currentAuthenticatedUser()
      .then(setLoggedInUser)
      .catch(() => null)
  }, [])

  if (loggedInUser) {
    return (
      <div className="flex h-full overflow-hidden">
        <IconDrawer
          closeMenu={closeMenu}
          loggedInUser={loggedInUser}
          navMenuOpen={navMenuOpen}
          openMenu={openMenu}
          setLoggedInUser={setLoggedInUser}
        >
          {children}
        </IconDrawer>
      </div>
    )
  }

  if (showContent) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <header
          className="flex flex-shrink-0 items-center gap-3 px-6 py-4"
          style={{ borderBottom: '1px solid var(--shell-border)' }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'var(--accent-subtle)',
              border: '1px solid var(--accent-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: 'Libre Baskerville, serif',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--accent)',
              }}
            >
              E
            </span>
          </div>
          <span
            className="font-display tracking-tight"
            style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '15px' }}
          >
            Email
          </span>
        </header>
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    )
  }

  return (
    <div
      className="flex h-full flex-col items-center justify-center"
      style={{
        background: 'var(--shell-bg)',
        backgroundImage: 'radial-gradient(ellipse 70% 55% at 50% -10%, rgba(124, 93, 244, 0.14) 0%, transparent 70%)',
      }}
    >
      {/* Noise grain overlay – fixed, pointer-events-none */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
          backgroundSize: '256px 256px',
        }}
      />

      {/* Double-bezel glass card */}
      <div
        className="animate-fade-slide-up"
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '1.5px',
          borderRadius: '20px',
          background: 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 32px 80px rgba(0,0,0,0.7), 0 0 60px rgba(124,93,244,0.1)',
        }}
      >
        {/* Inner core */}
        <div
          style={{
            background: 'var(--shell-surface)',
            borderRadius: '18.5px',
            padding: '44px 40px',
            width: '100%',
            maxWidth: '400px',
            minWidth: 'min(360px, calc(100vw - 32px))',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          {/* Logo block */}
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            {/* Monogram badge */}
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(124,93,244,0.18) 0%, rgba(124,93,244,0.06) 100%)',
                border: '1px solid var(--accent-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px',
                boxShadow: 'var(--glow-accent-sm), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              <span
                style={{
                  fontFamily: 'Libre Baskerville, serif',
                  fontSize: '26px',
                  fontWeight: 700,
                  color: 'var(--accent)',
                  lineHeight: 1,
                }}
              >
                E
              </span>
            </div>

            {/* Eyebrow tag */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '10px',
                padding: '3px 10px',
                borderRadius: '999px',
                background: 'var(--accent-subtle)',
                border: '1px solid var(--accent-border)',
              }}
            >
              <div
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  animation: 'glowPulse 2s ease infinite',
                }}
              />
              <span
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--accent)',
                }}
              >
                dbowland.com
              </span>
            </div>

            <h1
              style={{
                fontFamily: 'Libre Baskerville, serif',
                fontSize: '24px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.025em',
                margin: '0 0 6px',
                lineHeight: 1.2,
              }}
            >
              Email
            </h1>
            <p
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '13px',
                color: 'var(--text-muted)',
                margin: 0,
                letterSpacing: '0.01em',
              }}
            >
              Sign in to continue
            </p>
          </div>

          {/* Auth form */}
          <EmailsAuthenticator setLoggedInUser={setLoggedInUser} />
        </div>
      </div>

      {/* Privacy footnote */}
      <p
        className="animate-fade-in"
        style={{
          position: 'relative',
          zIndex: 1,
          marginTop: '20px',
          fontFamily: 'Outfit, sans-serif',
          fontSize: '11px',
          color: 'var(--text-muted)',
          letterSpacing: '0.02em',
          opacity: 0,
          animationDelay: '400ms',
          animationFillMode: 'forwards',
        }}
      >
        By signing in you agree to our{' '}
        <a href="/privacy-policy" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
          privacy policy
        </a>
      </p>
    </div>
  )
}

export default Authenticated
