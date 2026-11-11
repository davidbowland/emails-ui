import React from 'react'

export interface ColorInputProps {
  'data-testid'?: string
  id?: string
  label: string
  onChange: (value: string) => void
  value: string
}

const ColorInput = ({ 'data-testid': testId, id, label, onChange, value }: ColorInputProps): React.ReactNode => (
  <input
    aria-label={label}
    data-testid={testId}
    id={id}
    onChange={(event) => onChange(event.target.value)}
    style={{ display: 'none' }}
    type="color"
    value={value}
  />
)

export default ColorInput
