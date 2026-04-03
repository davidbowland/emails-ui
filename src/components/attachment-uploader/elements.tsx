import { Spinner } from '@heroui/react'
import React, { RefObject } from 'react'

export const AttachmentTag = ({ filename, onRemove }: { filename: string; onRemove: () => void }): React.ReactNode => (
  <div className="flex items-center gap-1 rounded-2xl border px-3 py-1">
    <span>{filename}</span>
    <button aria-label="Remove attachment" className="text-xs" onClick={onRemove}>
      ✕
    </button>
  </div>
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
  <div className="overflow-hidden rounded-2xl border p-2">
    {uploadingFilename === undefined ? (
      <input
        aria-label="Attachment upload"
        onChange={(event) => event.target.files?.[0] && onFileSelect(event.target.files[0])}
        ref={inputRef}
        type="file"
      />
    ) : (
      <span className="flex items-center gap-2">
        <Spinner /> Uploading {uploadingFilename}
      </span>
    )}
  </div>
)
