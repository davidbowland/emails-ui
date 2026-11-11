import React, { useState } from 'react'

export type ChipInputVariant = 'boxed' | 'underline'

export interface ChipInputProps {
  // Omit when a <label htmlFor={inputId}> names the input instead.
  ariaLabel?: string
  describedBy?: string
  enterKeyHint?: React.InputHTMLAttributes<HTMLInputElement>['enterKeyHint']
  inputId?: string
  invalid?: boolean
  // Returns whether the entry was accepted. Only an accepted entry clears the box; a rejected one
  // stays so it can be fixed.
  onAdd: (value: string) => boolean
  placeholder: string
  // Never disabled (G7): while read-only the text stays, uncommitted, and the border turns dashed.
  readOnly?: boolean
  ref?: React.Ref<HTMLInputElement>
  // 'boxed' is the bordered field of the spam filter's rule lists. 'underline' is the inline field
  // that sits among an address line's chips.
  variant?: ChipInputVariant
}

const variantStyle = (variant: ChipInputVariant, readOnly: boolean, focused: boolean): React.CSSProperties => {
  const borderStyle = readOnly ? 'dashed' : 'solid'
  return variant === 'boxed'
    ? {
        background: 'var(--paper-surface)',
        border: `1px ${borderStyle} var(--paper-border)`,
        flex: '1 1 auto',
        minWidth: '180px',
      }
    : {
        background: 'transparent',
        // Accent while focused, read-only included, so focus always shows; read-only keeps it dashed.
        borderBottom: `1px ${borderStyle} ${focused ? 'var(--accent)' : 'var(--paper-border)'}`,
        caretColor: 'var(--accent)',
        flex: '1 1 140px',
        minWidth: '140px',
        paddingBottom: '2px',
        transition: 'border-color 0.15s ease',
      }
}

// No outline utility on either variant: the global :focus-visible ring in index.css must stay
// visible, read-only included.
const VARIANT_CLASSES: Record<ChipInputVariant, string> = {
  boxed: 'rounded-md px-3 py-1.5 text-sm',
  underline: 'bg-transparent text-xs',
}

// A text box that turns each entry into a chip: Enter or leaving the box hands the text to onAdd.
const ChipInput = ({
  ariaLabel,
  describedBy,
  enterKeyHint,
  inputId,
  invalid,
  onAdd,
  placeholder,
  readOnly = false,
  ref,
  variant = 'boxed',
}: ChipInputProps): React.ReactNode => {
  const [focused, setFocused] = useState(false)

  const commitValue = (input: HTMLInputElement): void => {
    if (!readOnly && input.value.trim() && onAdd(input.value)) {
      input.value = ''
    }
  }

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>): void => {
    setFocused(false)
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
      className={VARIANT_CLASSES[variant]}
      enterKeyHint={enterKeyHint}
      id={inputId}
      onBlur={handleBlur}
      onFocus={() => setFocused(true)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      readOnly={readOnly}
      ref={ref}
      style={{
        color: 'var(--text-paper)',
        cursor: readOnly ? 'default' : undefined,
        fontFamily: 'IBM Plex Mono, monospace',
        ...variantStyle(variant, readOnly, focused),
      }}
      type="text"
    />
  )
}

export default ChipInput
