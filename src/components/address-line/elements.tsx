import { X } from 'lucide-react'
import React, { useState } from 'react'

// The 12px icon sits in a 24x24 target; the negative margin keeps the chip its visual size.
const deleteButtonStyle: React.CSSProperties = {
  margin: '-6px',
  minHeight: '24px',
  minWidth: '24px',
}

export const AddressChip = ({
  disabled = false,
  label,
  onDelete,
}: {
  disabled?: boolean
  label: string
  onDelete?: () => void
}): React.ReactNode => (
  <span
    className="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-xs"
    style={{
      background: 'var(--paper-surface)',
      border: '1px solid var(--paper-border)',
      color: 'var(--text-paper-muted)',
      fontFamily: 'IBM Plex Mono, monospace',
    }}
    title={label}
  >
    <span className="truncate">{label}</span>
    {onDelete && (
      <button
        aria-label={`Remove ${label}`}
        className="chip-delete flex shrink-0 items-center justify-center rounded-full transition-colors"
        data-testid="CancelIcon"
        disabled={disabled}
        onClick={onDelete}
        style={deleteButtonStyle}
      >
        <X aria-hidden="true" size={12} />
      </button>
    )}
  </span>
)

export const TagInput = ({
  ariaLabel = 'Email address',
  disabled,
  placeholder = 'Add address…',
  onAdd,
}: {
  ariaLabel?: string
  disabled: boolean
  placeholder?: string
  onAdd: (value: string) => void
}): React.ReactNode => {
  const [focused, setFocused] = useState(false)

  const commitValue = (input: HTMLInputElement): void => {
    if (input.value.trim()) {
      onAdd(input.value)
      input.value = ''
    }
  }

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>): void => {
    setFocused(false)
    commitValue(event.currentTarget)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitValue(event.currentTarget)
    }
  }

  return (
    <input
      aria-label={ariaLabel}
      className="bg-transparent text-xs outline-none"
      disabled={disabled}
      onBlur={handleBlur}
      onFocus={() => setFocused(true)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      style={{
        flex: '1 1 140px',
        minWidth: '140px',
        color: 'var(--text-paper)',
        fontFamily: 'IBM Plex Mono, monospace',
        caretColor: 'var(--accent)',
        borderBottom: `1px solid ${focused ? 'var(--accent)' : 'var(--paper-border)'}`,
        paddingBottom: '2px',
        transition: 'border-color 0.15s ease',
      }}
      type="text"
    />
  )
}
