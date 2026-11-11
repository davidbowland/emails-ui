import React, { useRef } from 'react'

import Button from '@components/ui/button'
import { PaperclipIcon } from '@components/ui/icons'

export interface FileInputProps {
  accept?: string
  // While true the trigger shows a spinner and ignores presses.
  busy?: boolean
  // Shown on the trigger in place of label while busy, e.g. "Uploading report.pdf".
  busyLabel?: string
  // The trigger's visible text and the file input's accessible name.
  label: string
  multiple?: boolean
  onFiles: (files: File[]) => void
}

// The native file input stays hidden; a library Button opens its picker.
const FileInput = ({ accept, busy = false, busyLabel, label, multiple, onFiles }: FileInputProps): React.ReactNode => {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(event.currentTarget.files ?? [])
    // Clear the selection so choosing the same file again still fires a change.
    event.currentTarget.value = ''
    if (files.length > 0) {
      onFiles(files)
    }
  }

  return (
    <>
      <input
        accept={accept}
        aria-label={label}
        hidden
        multiple={multiple}
        onChange={handleChange}
        ref={inputRef}
        tabIndex={-1}
        type="file"
      />
      <Button
        busy={busy}
        busyLabel={busyLabel}
        className="rounded-md px-2.5 py-1 text-xs"
        icon={PaperclipIcon}
        iconSize={12}
        onClick={() => inputRef.current?.click()}
        style={{ fontFamily: 'Outfit, sans-serif' }}
        variant="attachment"
      >
        {label}
      </Button>
    </>
  )
}

export default FileInput
