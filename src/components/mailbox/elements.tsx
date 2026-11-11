import React from 'react'

import Button from '@components/ui/button'
import Divider from '@components/ui/divider'
import IconButton from '@components/ui/icon-button'
import { ArrowLeftIcon, ArrowRightIcon } from '@components/ui/icons'

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
  <div style={{ margin: '0 12px' }}>
    <Divider opacity={0.6} surface="shell" />
  </div>
)

// Shows at every width: the inline display: flex overrides the md:hidden class, so md:hidden does
// nothing. It was like this before the component library too.
export const NavForwardButton = ({ onClick }: { onClick: () => void }): React.ReactNode => (
  <IconButton
    className="md:hidden"
    icon={ArrowRightIcon}
    label="Show selected email"
    onClick={onClick}
    size={15}
    style={{ borderRadius: '8px', display: 'flex', height: '30px', width: '30px' }}
    variant="shell"
  />
)

// Sits on the paper viewer, so it keeps its own colors rather than the shell variant's. Its inline
// display: flex overrides its own md:hidden class, as it did before the component library; it is
// hidden at md and up only because the bar around it in Mailbox is md:hidden.
export const NavBackButton = ({ onClick }: { onClick: () => void }): React.ReactNode => (
  <Button
    aria-label="Back to email list"
    className="md:hidden"
    icon={ArrowLeftIcon}
    iconSize={13}
    onClick={onClick}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = 'var(--shell-surface-hover)'
      e.currentTarget.style.color = 'var(--text-primary)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'transparent'
      e.currentTarget.style.color = 'var(--text-muted)'
    }}
    style={{
      background: 'transparent',
      border: 'none',
      borderRadius: '8px',
      color: 'var(--text-muted)',
      cursor: 'pointer',
      display: 'flex',
      fontFamily: 'Outfit, sans-serif',
      fontSize: '13px',
      gap: '6px',
      padding: '6px 10px',
      transition: 'background 0.15s ease, color 0.15s ease',
    }}
    variant="toolbar"
  >
    Back
  </Button>
)
