import React from 'react'

import Chip from '@components/ui/chip'
import ChipInput from '@components/ui/chip-input'
import { EmailAddress } from '@types'

type AddressSetter = (value: EmailAddress[]) => void

export interface AddressLineProps {
  addresses: EmailAddress[]
  label: string
  // Never disabled (spec G7): while read-only, typed text stays put and a press on a chip's remove
  // control shows readOnlyReason instead of removing anything.
  readOnly?: boolean
  readOnlyReason?: string
  setAddresses?: AddressSetter
}

const AddressLine = ({
  addresses,
  label,
  readOnly = false,
  readOnlyReason,
  setAddresses,
}: AddressLineProps): React.ReactNode => {
  // Returns whether the address was added, so the box clears only then.
  const handleAdd = (value: string): boolean => {
    if (!setAddresses || readOnly) return false
    const trimmed = value.trim()
    if (trimmed === '') return false
    setAddresses([...addresses.map((a) => ({ address: a.address, name: '' })), { address: trimmed, name: '' }])
    return true
  }

  const handleDelete = (index: number): void => {
    if (!setAddresses || readOnly) return
    const updated = addresses.filter((_, i) => i !== index).map((a) => ({ address: a.address, name: '' }))
    setAddresses(updated)
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-4 py-2">
      <span
        className="w-10 flex-shrink-0 text-xs font-medium uppercase"
        style={{
          color: 'var(--text-paper-muted)',
          fontFamily: 'Outfit, sans-serif',
          letterSpacing: '0.06em',
          paddingTop: '2px',
        }}
      >
        {label}
      </span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        {addresses.map((addr, index) => (
          <Chip
            key={index}
            label={addr.name ? `${addr.name} <${addr.address}>` : addr.address}
            onRemove={setAddresses ? () => handleDelete(index) : undefined}
            removeUnavailableReason={readOnly ? readOnlyReason : undefined}
          />
        ))}
        {setAddresses && (
          <ChipInput
            ariaLabel="Email address"
            onAdd={handleAdd}
            placeholder="Add address…"
            readOnly={readOnly}
            variant="underline"
          />
        )}
      </div>
    </div>
  )
}

export default AddressLine
