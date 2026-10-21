import { X } from 'lucide-react'
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
        className="chip-delete inline-flex items-center transition-colors"
        data-testid="CancelIcon"
        onClick={onDelete}
      >
        <X aria-hidden="true" size={12} strokeWidth={1.5} />
      </button>
    )}
  </span>
)

export interface RuleInputProps {
  // Omit when a <label htmlFor={inputId}> names the input instead.
  ariaLabel?: string
  describedBy?: string
  disabled: boolean
  enterKeyHint?: React.InputHTMLAttributes<HTMLInputElement>['enterKeyHint']
  inputId?: string
  invalid?: boolean
  // Returns whether the entry was accepted; a rejected entry stays in the box so it can be fixed.
  onAdd: (value: string) => boolean
  placeholder: string
}

export const RuleInput = ({
  ariaLabel,
  describedBy,
  disabled,
  enterKeyHint,
  inputId,
  invalid,
  onAdd,
  placeholder,
}: RuleInputProps): React.ReactNode => {
  const commitValue = (input: HTMLInputElement): void => {
    if (input.value.trim() && onAdd(input.value)) {
      input.value = ''
    }
  }

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>): void => {
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
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      aria-label={ariaLabel}
      // No outline utility here: the global :focus-visible ring in index.css must stay visible.
      className="rounded-md px-3 py-1.5 text-sm"
      disabled={disabled}
      enterKeyHint={enterKeyHint}
      id={inputId}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      style={{
        minWidth: '180px',
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
