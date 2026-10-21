import { AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react'
import React from 'react'

/* List row text (AC-035) */

// Subject, sender and time each read at least 4.5:1 on --shell-bg in every row state, at full
// opacity: --text-primary is 7.84:1, and --accent-hover (selected) is 5.88:1 -- 5.24:1 even on
// the selected row's violet tint. The old --text-muted read 2.29:1, and --accent only 4.50:1.
// Unread stays distinct by weight and the dot, never by color alone. contrast.test.ts holds
// these to the bar.
export interface ListRowState {
  isSelected: boolean
  isUnread: boolean
}

export const LIST_TEXT_COLOR = 'var(--text-primary)'
export const LIST_SELECTED_TEXT_COLOR = 'var(--accent-hover)'

const listTextColor = (isSelected: boolean): string => (isSelected ? LIST_SELECTED_TEXT_COLOR : LIST_TEXT_COLOR)

export const listSubjectStyle = ({ isSelected, isUnread }: ListRowState): React.CSSProperties => ({
  color: listTextColor(isSelected),
  fontFamily: 'Outfit, sans-serif',
  fontSize: '13px',
  fontWeight: isUnread ? 600 : 400,
  letterSpacing: '0.005em',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

export const listTimeStyle = ({ isSelected }: ListRowState): React.CSSProperties => ({
  color: listTextColor(isSelected),
  flexShrink: 0,
  fontFamily: 'IBM Plex Mono, monospace',
  fontSize: '10px',
})

export const listSenderStyle = ({ isSelected }: ListRowState): React.CSSProperties => ({
  color: listTextColor(isSelected),
  flex: 1,
  fontFamily: 'Outfit, sans-serif',
  fontSize: '11px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

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
