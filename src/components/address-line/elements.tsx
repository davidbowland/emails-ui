import { Chip } from '@heroui/react'
import React from 'react'

export const AddressChip = ({ label, onDelete }: { label: string; onDelete?: () => void }): React.ReactNode => (
  <span className="inline-flex items-center gap-1">
    <Chip variant="secondary">{label}</Chip>
    {onDelete && (
      <button aria-label={`Remove ${label}`} className="text-xs" data-testid="CancelIcon" onClick={onDelete}>
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
      className="min-w-[200px] flex-1 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-[#121212]"
      disabled={disabled}
      onKeyDown={handleKeyDown}
      placeholder={label}
      role="combobox"
      type="text"
    />
  )
}
