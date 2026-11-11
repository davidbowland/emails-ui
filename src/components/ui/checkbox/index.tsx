import React from 'react'

export interface CheckboxProps {
  checked: boolean
  // Added to the <label>, which is the whole clickable area. A caller that draws a card around the
  // box puts the card's padding here, so a click anywhere inside the card toggles it.
  className?: string
  // Defaults to the details' id. A caller that passes it replaces that default, so it can describe the
  // box by part of the details (for example counts, without a long list).
  describedBy?: string
  // Secondary text below the label, in the same clickable row. Never part of the name.
  details?: React.ReactNode
  label: React.ReactNode
  onChange: (checked: boolean) => void
  readOnly?: boolean
}

// Read-only ignores changes but is never disabled (G7).
const Checkbox = ({
  checked,
  className,
  describedBy,
  details,
  label,
  onChange,
  readOnly,
}: CheckboxProps): React.ReactNode => {
  const labelId = React.useId()
  const detailsId = React.useId()
  return (
    <label
      className={['flex min-h-11 items-start gap-2.5', className].filter(Boolean).join(' ')}
      style={{
        color: 'var(--text-paper)',
        cursor: readOnly ? 'default' : 'pointer',
        fontFamily: 'Outfit, sans-serif',
        fontSize: '14px',
      }}
    >
      <input
        aria-describedby={describedBy ?? (details === undefined ? undefined : detailsId)}
        aria-labelledby={labelId}
        aria-readonly={readOnly || undefined}
        checked={checked}
        className="mt-0.5 h-4 w-4 flex-shrink-0"
        onChange={(event) => {
          if (!readOnly) {
            onChange(event.target.checked)
          }
        }}
        type="checkbox"
      />
      {/* aria-labelledby names the box by the label span alone, so the details can sit inside the
          <label> (a click on them toggles, as on the label) without joining the name. */}
      <span className="min-w-0 flex-1">
        <span className="block" id={labelId}>
          {label}
        </span>
        {details !== undefined && (
          <span className="block" id={detailsId}>
            {details}
          </span>
        )}
      </span>
    </label>
  )
}

export default Checkbox
