import React, { useState } from 'react'

export const AddressChip = ({ label, onDelete }: { label: string; onDelete?: () => void }): React.ReactNode => (
  <span
    className="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-xs overflow-hidden"
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
        className="chip-delete flex h-3 w-3 items-center justify-center rounded-full text-xs transition-colors"
        data-testid="CancelIcon"
        onClick={onDelete}
      >
        ✕
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
