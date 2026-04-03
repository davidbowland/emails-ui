import React from 'react'

export const RuleChip = ({ label, onDelete }: { label: string; onDelete?: () => void }): React.ReactNode => (
  <span
    className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs"
    style={{
      background: 'var(--paper-surface)',
      border: '1px solid var(--paper-border)',
      color: 'var(--text-paper-muted)',
      fontFamily: 'IBM Plex Mono, monospace',
    }}
  >
    <span>{label}</span>
    {onDelete && (
      <button
        aria-label={`Remove ${label}`}
        className="transition-colors"
        data-testid="CancelIcon"
        onClick={onDelete}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-paper-muted)')}
        style={{ color: 'var(--text-paper-muted)' }}
      >
        ✕
      </button>
    )}
  </span>
)

export const RuleInput = ({
  disabled,
  onAdd,
}: {
  disabled: boolean
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
      className="rounded-md px-3 py-1.5 text-sm outline-none"
      disabled={disabled}
      onKeyDown={handleKeyDown}
      placeholder="Email, @domain.com, or * for all"
      role="combobox"
      style={{
        minWidth: '220px',
        flex: '1 1 auto',
        background: 'var(--paper-surface)',
        border: '1px solid var(--paper-border)',
        color: 'var(--text-paper)',
        fontFamily: 'IBM Plex Mono, monospace',
      }}
      type="text"
    />
  )
}
