import React, { RefObject } from 'react'

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
    <button
      aria-label="Remove attachment"
      className="transition-colors"
      onClick={onRemove}
      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-paper-muted)')}
      style={{ color: 'var(--text-paper-muted)' }}
    >
      ✕
    </button>
  </span>
)

export const UploadArea = ({
  inputRef,
  onFileSelect,
  uploadingFilename,
}: {
  inputRef: RefObject<HTMLInputElement | null>
  onFileSelect: (file: File) => void
  uploadingFilename: string | undefined
}): React.ReactNode => (
  <span
    className="inline-flex items-center rounded-md px-2.5 py-1 text-xs"
    style={{
      border: '1px dashed var(--paper-border)',
      color: 'var(--text-paper-muted)',
      fontFamily: 'Outfit, sans-serif',
    }}
  >
    {uploadingFilename === undefined ? (
      <input
        aria-label="Attachment upload"
        className="text-xs"
        onChange={(event) => event.target.files?.[0] && onFileSelect(event.target.files[0])}
        ref={inputRef}
        style={{ color: 'var(--text-paper-muted)' }}
        type="file"
      />
    ) : (
      <span className="flex items-center gap-2" style={{ color: 'var(--text-paper-muted)' }}>
        <span
          className="h-3 w-3 animate-spin rounded-full"
          style={{ border: '1.5px solid var(--paper-border)', borderTopColor: 'var(--accent)' }}
        />
        Uploading {uploadingFilename}
      </span>
    )}
  </span>
)
