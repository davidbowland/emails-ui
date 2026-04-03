import { Button, Spinner } from '@heroui/react'
import { Paperclip } from 'lucide-react'
import React from 'react'

export const AttachmentButton = ({
  disabled,
  filename,
  isDownloading,
  onClick,
  sizeLabel,
}: {
  disabled: boolean
  filename: string
  isDownloading: boolean
  onClick: () => void
  sizeLabel: string
}): React.ReactNode => (
  <span title={sizeLabel}>
    <Button isDisabled={disabled} onPress={onClick} variant="outline">
      {isDownloading ? <Spinner /> : <Paperclip size={14} />}
      {filename}
    </Button>
  </span>
)
