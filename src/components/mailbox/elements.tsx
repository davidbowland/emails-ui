import { AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react'
import React from 'react'

export const EmailListDivider = (): React.ReactNode => (
  <div
    style={{
      height: '1px',
      background: 'var(--shell-border)',
      margin: '0 12px',
      opacity: 0.6,
    }}
  />
)

export const BouncedChip = (): React.ReactNode => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '3px',
      borderRadius: '6px',
      padding: '2px 6px',
      background: 'var(--accent-subtle)',
      border: '1px solid var(--accent-border)',
      color: 'var(--accent)',
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: '10px',
      fontWeight: 500,
      flexShrink: 0,
      whiteSpace: 'nowrap',
    }}
  >
    <AlertCircle size={9} strokeWidth={1.5} />
    Bounced
  </span>
)

export const NavForwardButton = ({ onClick }: { onClick: () => void }): React.ReactNode => (
  <button
    aria-label="Show selected email"
    className="md:hidden"
    onClick={onClick}
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
    <ArrowRight size={15} strokeWidth={1.5} />
  </button>
)

export const NavBackButton = ({ onClick }: { onClick: () => void }): React.ReactNode => (
  <button
    aria-label="Back to email list"
    className="md:hidden"
    onClick={onClick}
    onMouseEnter={(e) => {
      ;(e.currentTarget as HTMLElement).style.background = 'var(--shell-surface-hover)'
      ;(e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'
    }}
    onMouseLeave={(e) => {
      ;(e.currentTarget as HTMLElement).style.background = 'transparent'
      ;(e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'
    }}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 10px',
      borderRadius: '8px',
      color: 'var(--text-muted)',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      fontFamily: 'Outfit, sans-serif',
      fontSize: '13px',
      transition: 'background 0.15s ease, color 0.15s ease',
    }}
  >
    <ArrowLeft size={13} strokeWidth={1.5} />
    Back
  </button>
)
