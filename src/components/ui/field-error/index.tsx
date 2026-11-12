import React from 'react'

import { AlertCircleIcon } from '@components/ui/icons'

export interface FieldErrorProps {
  id: string
  message?: string
}

// A field's refusal line. Mounted whether or not there is a message: a live region created in the
// same commit as its content is reliably not announced.
const FieldError = ({ id, message }: FieldErrorProps): React.ReactNode => (
  <p
    className="flex items-start gap-1.5 text-sm"
    id={id}
    role="status"
    style={{ color: 'var(--text-paper)', fontFamily: 'Outfit, sans-serif', marginTop: message ? '8px' : 0 }}
  >
    {message && (
      <>
        <AlertCircleIcon size={14} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '3px' }} />
        <span>{message}</span>
      </>
    )}
  </p>
)

export default FieldError
