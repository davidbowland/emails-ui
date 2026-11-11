import React from 'react'

import Button from '@components/ui/button'
import { PaperclipIcon } from '@components/ui/icons'

export const DOWNLOADING_REASON = 'Wait until the other attachment finishes downloading.'

export const AttachmentButton = ({
  filename,
  isDownloading,
  onClick,
  sizeLabel,
  unavailableReason,
}: {
  filename: string
  isDownloading: boolean
  onClick: () => void
  sizeLabel: string
  unavailableReason?: string
}): React.ReactNode => (
  <Button
    busy={isDownloading}
    className="rounded-md px-2.5 py-1.5 text-xs font-medium transition-all"
    icon={PaperclipIcon}
    iconSize={12}
    onClick={onClick}
    style={{ cursor: isDownloading ? 'progress' : 'pointer', fontFamily: 'IBM Plex Mono, monospace', gap: '6px' }}
    title={sizeLabel}
    unavailableReason={unavailableReason}
    variant="attachment"
  >
    {filename}
  </Button>
)
