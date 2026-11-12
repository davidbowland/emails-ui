import React, { useCallback, useRef, useState } from 'react'

import Button from '@components/ui/button'
import { PlusIcon } from '@components/ui/icons'

export type ChipInputVariant = 'boxed' | 'underline'

export interface ChipInputProps {
  // While set and the box holds text, an inline Add button appears, named by this label.
  // addLabel and addOnBlur={false} are meant for controlled use (value + onDraftChange).
  addLabel?: string
  // Default true. With false, leaving the box never commits; the text stays as a pending entry.
  addOnBlur?: boolean
  // Omit when a <label htmlFor={inputId}> names the input instead.
  ariaLabel?: string
  describedBy?: string
  enterKeyHint?: React.InputHTMLAttributes<HTMLInputElement>['enterKeyHint']
  inputId?: string
  invalid?: boolean
  // Returns whether the entry was accepted. Only an accepted entry clears the box; a rejected one
  // stays so it can be fixed.
  onAdd: (value: string) => boolean
  // With value, makes the text controlled. Called on every keystroke, and with '' after an accepted add.
  onDraftChange?: (text: string) => void
  placeholder: string
  // Never disabled (G7): while read-only the text stays, uncommitted, and the border turns dashed.
  readOnly?: boolean
  // Why the Add button is unavailable while read-only.
  readOnlyReason?: string
  ref?: React.Ref<HTMLInputElement>
  // 'boxed' is the bordered field of the spam filter's rule lists. 'underline' is the inline field
  // that sits among an address line's chips.
  value?: string
  variant?: ChipInputVariant
}

const assignRef = <T,>(ref: React.Ref<T> | undefined, node: T | null): void => {
  if (typeof ref === 'function') {
    ref(node)
  } else if (ref) {
    ref.current = node
  }
}

const variantStyle = (
  variant: ChipInputVariant,
  readOnly: boolean,
  focused: boolean,
  pending: boolean,
): React.CSSProperties => {
  const borderStyle = readOnly ? 'dashed' : 'solid'
  const pendingBorder = '2px dashed var(--accent-deep)'
  return variant === 'boxed'
    ? {
        background: 'var(--paper-surface)',
        border: pending ? pendingBorder : `1px ${borderStyle} var(--paper-border)`,
        flex: '1 1 auto',
        minWidth: '180px',
        // The 2px pending border takes 1px off the padding, so the box keeps its size.
        ...(pending ? { padding: '5px 11px' } : {}),
      }
    : {
        background: 'transparent',
        // Accent while focused, read-only included, so focus always shows; read-only keeps it dashed.
        borderBottom: pending
          ? pendingBorder
          : `1px ${borderStyle} ${focused ? 'var(--accent)' : 'var(--paper-border)'}`,
        caretColor: 'var(--accent)',
        flex: '1 1 140px',
        minWidth: '140px',
        paddingBottom: pending ? '1px' : '2px',
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
  addLabel,
  addOnBlur = true,
  ariaLabel,
  describedBy,
  enterKeyHint,
  inputId,
  invalid,
  onAdd,
  onDraftChange,
  placeholder,
  readOnly = false,
  readOnlyReason,
  ref,
  value,
  variant = 'boxed',
}: ChipInputProps): React.ReactNode => {
  const [focused, setFocused] = useState(false)
  const [ownText, setOwnText] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)
  const controlled = value !== undefined
  // Uncontrolled, the DOM owns the text (a caller can read or clear it through the
  // ref); ownText only mirrors it so the Add button knows whether to show.
  const readText = (): string => (controlled ? value : (inputRef.current?.value ?? ''))
  const hasText = (controlled ? value : ownText).trim() !== ''
  const pending = hasText && !addOnBlur

  const changeText = (next: string): void => {
    setOwnText(next)
    onDraftChange?.(next)
  }

  const setRefs = useCallback(
    (element: HTMLInputElement | null): void => {
      inputRef.current = element
      assignRef(ref, element)
    },
    [ref],
  )

  const commit = (): void => {
    const text = readText()
    if (!readOnly && text.trim() && onAdd(text)) {
      if (!controlled && inputRef.current) {
        inputRef.current.value = ''
      }
      changeText('')
    }
  }

  // The Add button unmounts once the text clears, so focus goes back to the box either way.
  const handleAdd = (): void => {
    commit()
    inputRef.current?.focus()
  }

  const handleBlur = (): void => {
    setFocused(false)
    if (addOnBlur) {
      commit()
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault()
      commit()
    }
  }

  const input = (
    <input
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      aria-label={ariaLabel}
      className={VARIANT_CLASSES[variant]}
      enterKeyHint={enterKeyHint}
      id={inputId}
      onBlur={handleBlur}
      onChange={(event) => changeText(event.target.value)}
      onFocus={() => setFocused(true)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      readOnly={readOnly}
      ref={setRefs}
      style={{
        color: 'var(--text-paper)',
        cursor: readOnly ? 'default' : undefined,
        fontFamily: 'IBM Plex Mono, monospace',
        ...(addLabel ? { outlineOffset: '3px' } : {}),
        ...variantStyle(variant, readOnly, focused, pending),
        // Inside the wrapper the input fills the row beside the Add button.
        ...(addLabel ? { flex: '1 1 auto', minWidth: 0 } : {}),
      }}
      type="text"
      value={value}
    />
  )

  if (!addLabel) {
    return input
  }

  // The wrapper takes over the variant's flex sizing, so in a chip list the entry row sits on its
  // own line under the chips.
  return (
    <span className="inline-flex items-center" style={{ flex: '1 1 100%', gap: '8px' }}>
      {input}
      {hasText && (
        <Button
          aria-label={addLabel}
          className="min-h-[34px] max-sm:min-h-[44px]"
          icon={PlusIcon}
          iconSize={12}
          onClick={handleAdd}
          // A press must not take focus from the box: on Android, losing it closes the keyboard.
          onMouseDown={(event) => event.preventDefault()}
          style={{ boxShadow: 'none' }}
          unavailableReason={readOnly ? readOnlyReason : undefined}
          variant="primary"
        >
          Add
        </Button>
      )}
    </span>
  )
}

export default ChipInput
