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
  <button
    className="btn-attachment inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all"
    disabled={disabled}
    onClick={onClick}
    style={{
      fontFamily: 'IBM Plex Mono, monospace',
      cursor: disabled ? 'not-allowed' : 'pointer',
    }}
    title={sizeLabel}
  >
    {isDownloading ? (
      <span
        className="h-3 w-3 animate-spin rounded-full"
        style={{ border: '1.5px solid var(--paper-border)', borderTopColor: 'var(--accent)' }}
      />
    ) : (
      <Paperclip size={12} />
    )}
    {filename}
  </button>
)
