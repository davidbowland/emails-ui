import React from 'react'

import Button from '@components/ui/button'
import ButtonIconTile, { BUTTON_ICON_TILE_SIZE } from '@components/ui/button-icon-tile'
import { SendIcon, TrashIcon } from '@components/ui/icons'

export const SENDING_REASON = 'Wait until your email finishes sending.'

const SendTileIcon = (): React.ReactNode => <ButtonIconTile icon={SendIcon} />

export const SendButton = ({ busy, onClick }: { busy: boolean; onClick: () => void }): React.ReactNode => (
  <Button
    busy={busy}
    busyLabel="Sending…"
    icon={SendTileIcon}
    iconSize={BUTTON_ICON_TILE_SIZE}
    onClick={onClick}
    style={{
      cursor: busy ? 'progress' : 'pointer',
      display: 'flex',
      fontFamily: 'Outfit, sans-serif',
      fontSize: '14px',
      fontWeight: 600,
      gap: '8px',
      letterSpacing: '0.01em',
      padding: '9px 20px',
    }}
    variant="primary"
  >
    Send
  </Button>
)

export const DiscardButton = ({
  onClick,
  unavailableReason,
}: {
  onClick: () => void
  unavailableReason?: string
}): React.ReactNode => (
  <Button
    icon={TrashIcon}
    iconSize={13}
    onClick={onClick}
    style={{
      cursor: 'pointer',
      display: 'flex',
      fontFamily: 'Outfit, sans-serif',
      fontSize: '14px',
      fontWeight: 400,
      gap: '8px',
      padding: '9px 16px',
    }}
    unavailableReason={unavailableReason}
    variant="secondary"
  >
    Discard
  </Button>
)
