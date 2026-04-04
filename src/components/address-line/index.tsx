import React from 'react'

import { AddressChip, TagInput } from './elements'
import { EmailAddress } from '@types'

type AddressSetter = (value: EmailAddress[]) => void

export interface AddressLineProps {
  addresses: EmailAddress[]
  label: string
  setAddresses?: AddressSetter
}

const AddressLine = ({ addresses, label, setAddresses }: AddressLineProps): React.ReactNode => {
  const handleAdd = (value: string): void => {
    if (!setAddresses) return
    const trimmed = value.trim()
    if (trimmed === '') return
    setAddresses([...addresses.map((a) => ({ address: a.address, name: '' })), { address: trimmed, name: '' }])
  }

  const handleDelete = (index: number): void => {
    if (!setAddresses) return
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
          <AddressChip
            key={index}
            label={addr.name ? `${addr.name} <${addr.address}>` : addr.address}
            onDelete={setAddresses ? () => handleDelete(index) : undefined}
          />
        ))}
        {setAddresses && <TagInput disabled={false} label="Email address" onAdd={handleAdd} />}
      </div>
    </div>
  )
}

export default AddressLine
