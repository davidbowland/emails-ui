import React from 'react'

import FileInput from '@components/ui/file-input'
import IconButton from '@components/ui/icon-button'
import { CloseIcon } from '@components/ui/icons'

export const AttachmentTag = ({ filename, onRemove }: { filename: string; onRemove: () => void }): React.ReactNode => (
  <span
    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs"
    style={{
      background: 'var(--paper-surface)',
      border: '1px solid var(--paper-border)',
      color: 'var(--text-paper-muted)',
      fontFamily: 'IBM Plex Mono, monospace',
    }}
  >
    <span>{filename}</span>
    {/* The negative margin keeps the 24px hit target from growing the tag, as Chip's remove does. */}
    <IconButton
      className="transition-colors"
      icon={CloseIcon}
      label={`Remove ${filename}`}
      onClick={onRemove}
      size={12}
      style={{ margin: '-6px' }}
      variant="close"
    />
  </span>
)

export const UploadArea = ({
  onFileSelect,
  uploadingFilename,
}: {
  onFileSelect: (file: File) => void
  uploadingFilename: string | undefined
}): React.ReactNode => (
  <FileInput
    busy={uploadingFilename !== undefined}
    busyLabel={uploadingFilename === undefined ? undefined : `Uploading ${uploadingFilename}…`}
    label="Attach a file"
    onFiles={(files) => onFileSelect(files[0])}
  />
)
