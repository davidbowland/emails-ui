import React from 'react'

import { alreadyListed } from '@components/bounce-sender-input'
import Chip from '@components/ui/chip'
import ChipInput, { ChipInputProps } from '@components/ui/chip-input'
import { EmailAddress } from '@types'

type AddressSetter = (value: EmailAddress[]) => void

export const forwardAddressError = (addresses: string[], entry: string): string | undefined => {
  const trimmed = entry.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return 'Enter an email address, like name@example.com.'
  }
  return addresses.some((address) => address.trim().toLowerCase() === trimmed.toLowerCase())
    ? alreadyListed(trimmed)
    : undefined
}

export interface AddressLineProps {
  addLabel?: string
  addOnBlur?: boolean
  addresses: EmailAddress[]
  describedBy?: string
  // With onDraftChange, makes the text in the box controlled.
  draft?: string
  inputId?: string
  inputRef?: ChipInputProps['ref']
  invalid?: boolean
  onDraftChange?: (text: string) => void
  // Called with the trimmed entry when validate refuses it, so the caller can show why.
  onInvalid?: (value: string) => void
  // Appended to the input's description while the draft has text. Pair with a rendered PendingHint.
  pendingHintId?: string
  // A chip whose address is not in this list shows as new ("not saved yet").
  savedEntries?: string[]
  // Without it, every non-empty entry is accepted (Compose, EmailViewer).
  validate?: (value: string) => boolean
  label: string
  // Never disabled (spec G7): while read-only, typed text stays put and a press on a chip's remove
  // control shows readOnlyReason instead of removing anything.
  readOnly?: boolean
  readOnlyReason?: string
  setAddresses?: AddressSetter
}

const AddressLine = ({
  addLabel,
  addOnBlur,
  addresses,
  describedBy,
  draft,
  inputId,
  inputRef,
  invalid,
  label,
  onDraftChange,
  onInvalid,
  pendingHintId,
  readOnly = false,
  readOnlyReason,
  savedEntries,
  setAddresses,
  validate,
}: AddressLineProps): React.ReactNode => {
  // Returns whether the address was added, so the box clears only then.
  const handleAdd = (value: string): boolean => {
    if (!setAddresses || readOnly) return false
    const trimmed = value.trim()
    if (trimmed === '') return false
    if (validate && !validate(trimmed)) {
      onInvalid?.(trimmed)
      return false
    }
    setAddresses([...addresses.map((a) => ({ address: a.address, name: '' })), { address: trimmed, name: '' }])
    return true
  }

  const handleDelete = (index: number): void => {
    if (!setAddresses || readOnly) return
    const updated = addresses.filter((_, i) => i !== index).map((a) => ({ address: a.address, name: '' }))
    setAddresses(updated)
  }

  const LabelTag = inputId ? 'label' : 'span'

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-4 py-2">
      <LabelTag
        className="w-10 flex-shrink-0 text-xs font-medium uppercase"
        {...(inputId ? { htmlFor: inputId } : {})}
        style={{
          color: 'var(--text-paper-muted)',
          fontFamily: 'Outfit, sans-serif',
          letterSpacing: '0.06em',
          paddingTop: '2px',
        }}
      >
        {label}
      </LabelTag>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        {addresses.map((addr, index) => (
          <Chip
            isNew={savedEntries ? !savedEntries.includes(addr.address) : undefined}
            key={index}
            label={addr.name ? `${addr.name} <${addr.address}>` : addr.address}
            onRemove={setAddresses ? () => handleDelete(index) : undefined}
            removeUnavailableReason={readOnly ? readOnlyReason : undefined}
          />
        ))}
        {setAddresses && (
          <ChipInput
            addLabel={addLabel}
            addOnBlur={addOnBlur}
            ariaLabel={inputId ? undefined : 'Email address'}
            describedBy={
              [describedBy, draft?.trim() ? pendingHintId : undefined].filter(Boolean).join(' ') || undefined
            }
            inputId={inputId}
            invalid={invalid}
            onAdd={handleAdd}
            onDraftChange={onDraftChange}
            placeholder="Add address…"
            readOnly={readOnly}
            readOnlyReason={readOnlyReason}
            ref={inputRef}
            value={draft}
            variant="underline"
          />
        )}
      </div>
    </div>
  )
}

export default AddressLine
