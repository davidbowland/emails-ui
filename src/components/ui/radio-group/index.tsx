import React from 'react'

export interface RadioOption {
  description?: React.ReactNode
  label: React.ReactNode
  value: string
}

export interface RadioGroupProps {
  busy?: boolean
  describedBy?: string
  // Shown between the legend and the options, and part of the group's description. The caller
  // styles it; the wrapper only carries the id.
  help?: React.ReactNode
  legend: React.ReactNode
  name: string
  onChange: (value: string) => void
  options: RadioOption[]
  readOnly?: boolean
  value: string
}

// Read-only ignores changes but is never disabled (G7).
const RadioGroup = ({
  busy,
  describedBy,
  help,
  legend,
  name,
  onChange,
  options,
  readOnly,
  value,
}: RadioGroupProps): React.ReactNode => {
  const idPrefix = React.useId()
  const helpId = `${idPrefix}-help`
  const groupDescribedBy = [help === undefined ? undefined : helpId, describedBy].filter(Boolean).join(' ') || undefined
  return (
    // radiogroup rather than a fieldset's implicit group role, because only radiogroup supports
    // aria-readonly, which tells assistive tech the choice can't change right now.
    <fieldset
      aria-busy={busy}
      aria-describedby={groupDescribedBy}
      aria-readonly={readOnly || undefined}
      role="radiogroup"
      style={{ border: 'none', margin: 0, padding: 0 }}
    >
      <legend
        className="text-xs font-semibold uppercase"
        style={{ color: 'var(--text-paper-muted)', fontFamily: 'Outfit, sans-serif', letterSpacing: '0.1em' }}
      >
        {legend}
      </legend>
      {help === undefined ? null : <div id={helpId}>{help}</div>}
      {options.map((option, index) => {
        const labelId = `${idPrefix}-${index}-label`
        const descriptionId = `${idPrefix}-${index}-description`
        return (
          // The label wraps the input so the whole 44px row is the target.
          <label
            key={option.value}
            style={{
              alignItems: 'center',
              color: 'var(--text-paper)',
              cursor: readOnly ? 'default' : 'pointer',
              display: 'flex',
              fontFamily: 'Outfit, sans-serif',
              fontSize: '14px',
              gap: '10px',
              minHeight: '44px',
            }}
          >
            <input
              // Named by the label alone; the description is the description, not part of the name.
              aria-describedby={option.description === undefined ? undefined : descriptionId}
              aria-labelledby={labelId}
              checked={value === option.value}
              name={name}
              onChange={() => {
                if (!readOnly) {
                  onChange(option.value)
                }
              }}
              style={{ flexShrink: 0, margin: 0 }}
              type="radio"
              value={option.value}
            />
            <span>
              <span id={labelId}>{option.label}</span>
              {option.description === undefined ? null : (
                <span
                  className="block text-xs"
                  id={descriptionId}
                  style={{ color: 'var(--text-paper-muted)', fontFamily: 'Outfit, sans-serif' }}
                >
                  {option.description}
                </span>
              )}
            </span>
          </label>
        )
      })}
    </fieldset>
  )
}

export default RadioGroup
