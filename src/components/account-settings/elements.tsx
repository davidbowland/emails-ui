import React from 'react'

import Button from '@components/ui/button'
import ButtonIconTile, { BUTTON_ICON_TILE_SIZE } from '@components/ui/button-icon-tile'
import { SaveIcon } from '@components/ui/icons'

// Why a control in a section Save owns can't run while Save is busy. AccountSettings passes it to
// every such control as its readOnlyReason. Worded for the mail check too, when nothing is being
// written yet.
export const WAIT_FOR_SAVE_REASON = 'Wait until Save finishes.'

export const SettingsCard = ({ children }: { children: React.ReactNode }): React.ReactNode => (
  <div
    style={{
      height: '100%',
      width: '100%',
      overflowY: 'auto',
      background: 'var(--paper-bg)',
      color: 'var(--text-paper)',
    }}
  >
    {children}
  </div>
)

export const SettingsTitle = (): React.ReactNode => (
  <div style={{ marginBottom: '4px' }}>
    {/* Eyebrow */}
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: '999px',
        background: 'var(--accent-subtle)',
        border: '1px solid var(--accent-border)',
        marginBottom: '10px',
      }}
    >
      <span
        style={{
          fontFamily: 'Outfit, sans-serif',
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase' as const,
          color: 'var(--accent)',
        }}
      >
        Preferences
      </span>
    </div>
    <h1
      className="font-display"
      style={{
        color: 'var(--text-paper)',
        fontWeight: 400,
        fontSize: '26px',
        letterSpacing: '-0.025em',
        margin: 0,
        lineHeight: 1.2,
      }}
    >
      Account Settings
    </h1>
  </div>
)

const SaveTileIcon = (): React.ReactNode => <ButtonIconTile icon={SaveIcon} />

const SAVE_BUTTON_STYLE: React.CSSProperties = {
  fontFamily: 'Outfit, sans-serif',
  fontSize: '14px',
  fontWeight: 600,
  letterSpacing: '0.01em',
  padding: '9px 20px',
}

// Never disabled (spec G4): with nothing to save, a press says so instead of saving; while a save or
// the phrase check runs, it is busy. Busy and unavailable both keep the button in the tab order, so
// focus stays on it when the save lands instead of dropping to the top of the page.
export const SaveButton = ({
  hasUnsavedChanges,
  isChecking,
  isSaving,
  onClick,
}: {
  hasUnsavedChanges: boolean
  isChecking: boolean
  isSaving: boolean
  onClick: () => void
}): React.ReactNode => (
  <Button
    busy={isChecking || isSaving}
    busyLabel={isChecking ? 'Checking your mail…' : 'Saving…'}
    icon={SaveTileIcon}
    iconSize={BUTTON_ICON_TILE_SIZE}
    onClick={onClick}
    style={SAVE_BUTTON_STYLE}
    unavailableReason={hasUnsavedChanges ? undefined : 'You have no changes to save.'}
    variant="primary"
  >
    Save
  </Button>
)
