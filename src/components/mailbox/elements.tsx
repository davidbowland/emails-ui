import { AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react'
import React from 'react'

export const MailboxPanel = ({ children }: { children: React.ReactNode }): React.ReactNode => (
  <div
    className="flex h-full flex-col overflow-hidden"
    style={{
      width: 'var(--list-width)',
      flexShrink: 0,
      background: 'var(--shell-surface)',
      borderRight: '1px solid var(--shell-border)',
    }}
  >
    {children}
  </div>
)

export const ViewerPanel = ({ children }: { children: React.ReactNode }): React.ReactNode => (
  <div
    className="flex h-full flex-1 flex-col overflow-hidden"
    style={{ background: 'var(--paper-bg)', color: 'var(--text-paper)' }}
  >
    {children}
  </div>
)

export const EmailListDivider = (): React.ReactNode => (
  <div style={{ height: '1px', background: 'var(--shell-border)', marginLeft: '16px' }} />
)

export const BouncedChip = (): React.ReactNode => (
  <span
    className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-medium"
    style={{
      background: 'rgba(196, 92, 42, 0.12)',
      border: '1px solid rgba(196, 92, 42, 0.3)',
      color: 'var(--accent)',
      fontFamily: 'IBM Plex Mono, monospace',
      flexShrink: 0,
    }}
  >
    <AlertCircle size={10} />
    Bounced
  </span>
)

export const NavForwardButton = ({ onClick }: { onClick: () => void }): React.ReactNode => (
  <button
    aria-label="Show selected email"
    className="rounded-full p-2 transition-colors md:hidden"
    onClick={onClick}
    style={{ color: 'var(--text-muted)' }}
  >
    <ArrowRight size={16} />
  </button>
)

export const NavBackButton = ({ onClick }: { onClick: () => void }): React.ReactNode => (
  <button
    aria-label="Back to email list"
    className="flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition-colors md:hidden"
    onClick={onClick}
    style={{ color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif' }}
  >
    <ArrowLeft size={14} />
    Back
  </button>
)
