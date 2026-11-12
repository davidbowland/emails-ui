import React from 'react'

import { useKeyboardInset } from './use-keyboard-inset'
import Button from '@components/ui/button'

export type UnsavedBarPhase = 'dirty' | 'busy' | 'saved' | 'failed' | 'discarded'

export interface UnsavedBarAction {
  label: string
  onPress: () => void
  unavailableReason?: string
}

export interface UnsavedBarProps {
  // A can't-act note under the detail.
  note?: string
  // One line with the title and the primary button only (phone, keyboard open). The title is cut
  // off with an ellipsis here, so pass plain text: a button inside it could be hidden yet focusable.
  compact?: boolean
  detail?: React.ReactNode
  phase: UnsavedBarPhase
  // Busy when phase === 'busy': the button ignores presses and shows busyLabel.
  primary?: UnsavedBarAction & { busyLabel?: string }
  // The primary button, so the caller can return focus to it (after a dialog, Undo or Keep editing).
  primaryRef?: React.Ref<HTMLButtonElement>
  // The message block, tabIndex -1, so the caller can move focus to it.
  ref?: React.Ref<HTMLDivElement>
  regionLabel: string
  secondary?: UnsavedBarAction
  // May contain buttons (section names).
  title: React.ReactNode
}

const TEXT_FONT = { fontFamily: 'Outfit, sans-serif' }

const UnsavedBar = ({
  compact = false,
  detail,
  note,
  phase,
  primary,
  primaryRef,
  ref,
  regionLabel,
  secondary,
  title,
}: UnsavedBarProps): React.ReactNode => {
  const keyboardInset = useKeyboardInset()
  const primaryButton = primary && (
    <Button
      busy={phase === 'busy'}
      busyLabel={primary.busyLabel}
      className="max-sm:min-h-[44px] max-sm:w-full"
      onClick={primary.onPress}
      ref={primaryRef}
      unavailableReason={primary.unavailableReason}
      variant="primary"
    >
      {primary.label}
    </Button>
  )

  return (
    <div
      aria-label={regionLabel}
      className="unsaved-bar sticky z-[1] rounded-[14px]"
      role="region"
      style={{
        background: 'var(--shell-surface)',
        border: '1px solid var(--shell-border)',
        // 8px above the bottom, plus whatever the on-screen keyboard covers (iOS).
        bottom: `calc(8px + ${keyboardInset}px)`,
        boxShadow: 'var(--shadow-md)',
        margin: '0 8px',
        padding: compact ? '8px 12px' : '12px 16px',
      }}
    >
      <div
        className={
          compact
            ? 'flex items-center justify-between gap-3'
            : 'flex max-w-2xl items-center justify-between gap-4 max-sm:flex-col max-sm:items-stretch'
        }
      >
        <div className="focus-target min-w-0" ref={ref} style={TEXT_FONT} tabIndex={-1}>
          <div
            className={compact ? 'truncate' : 'font-semibold'}
            style={{ color: '#fdfaf5', fontSize: compact ? '13px' : '15px' }}
          >
            {title}
          </div>
          {!compact && detail && (
            <div className="text-sm" style={{ color: 'var(--text-primary)', marginTop: '2px' }}>
              {detail}
            </div>
          )}
          {!compact && note && (
            <p className="text-sm" style={{ color: 'var(--text-primary)', margin: '4px 0 0' }}>
              {note}
            </p>
          )}
        </div>
        <div className={compact ? 'shrink-0' : 'flex shrink-0 items-center gap-2 max-sm:flex-col'}>
          {!compact && secondary && (
            <Button
              className="max-sm:min-h-[44px] max-sm:w-full"
              onClick={secondary.onPress}
              unavailableReason={secondary.unavailableReason}
              variant="shell"
            >
              {secondary.label}
            </Button>
          )}
          {primaryButton}
        </div>
      </div>
    </div>
  )
}

export default UnsavedBar
