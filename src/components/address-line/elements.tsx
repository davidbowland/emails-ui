import React from 'react'

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
  disabled,
  label,
  onAdd,
}: {
  disabled: boolean
  label: string
  onAdd: (value: string) => void
}): React.ReactNode => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault()
      const input = event.currentTarget
      if (input.value.trim()) {
        onAdd(input.value)
        input.value = ''
      }
    }
  }

  return (
    <input
      aria-label={label}
      className="bg-transparent text-xs outline-none"
      disabled={disabled}
      onKeyDown={handleKeyDown}
      placeholder={label}
      role="combobox"
      style={{
        minWidth: '160px',
        color: 'var(--text-paper)',
        fontFamily: 'IBM Plex Mono, monospace',
        caretColor: 'var(--accent)',
      }}
      type="text"
    />
  )
}
