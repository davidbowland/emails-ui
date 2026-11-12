import React from 'react'

import Chip from '@components/ui/chip'
import ChipInput, { ChipInputProps } from '@components/ui/chip-input'

type BounceRuleSetter = (value: string[]) => void

export interface BounceSenderInputProps {
  // Appended to the input's description while the draft has text. Pair with a rendered PendingHint.
  pendingHintId?: string
  // Turns the Add button on and names it. For controlled use, with addOnBlur={false}.
  addLabel?: string
  addOnBlur?: boolean
  // With onDraftChange, makes the text in the box controlled.
  draft?: string
  onDraftChange?: (text: string) => void
  // A chip whose value is not in this list shows as new ("not saved yet").
  savedEntries?: string[]
  // Points at helper text or an inline error, so a screen reader hears it with the field.
  describedBy?: string
  enterKeyHint?: ChipInputProps['enterKeyHint']
  // When given, the label becomes a <label> for this id and names the input.
  inputId?: string
  // Lets a caller focus the box, as it does to point at an entry the box refused.
  inputRef?: ChipInputProps['ref']
  invalid?: boolean
  label: string
  // Called with the trimmed entry when it fails validation, so the caller can show why.
  onInvalid?: (value: string) => void
  placeholder?: string
  // Never disabled (spec G7): while read-only, typed text stays put and a press on a chip's remove
  // control shows readOnlyReason instead of removing anything.
  readOnly?: boolean
  readOnlyReason?: string
  rules: string[]
  setRules?: BounceRuleSetter
  // Reuse for another list (block phrases, trusted senders): only the new entry is checked, and
  // a failing one is not added. Without it, the bounce rules below apply.
  validate?: (value: string) => boolean
}

const validateBounceRule = (input: string): boolean => {
  const trimmed = input.trim()

  if (trimmed === '*') {
    return true
  }

  const atIndex = trimmed.indexOf('@')
  if (atIndex > 0) {
    return trimmed.indexOf('.', atIndex) > 0
  }

  return trimmed.indexOf('.') > 0
}

const isDuplicate = (rules: string[], entry: string): boolean =>
  rules.some((rule) => rule.trim().toLowerCase() === entry.toLowerCase())

export const alreadyListed = (entry: string): string => `\u201C${entry}\u201D is already on your list.`

export const bounceRuleError = (rules: string[], entry: string): string | undefined => {
  const trimmed = entry.trim()
  if (!validateBounceRule(trimmed)) {
    return 'Enter an address (user@domain.com), a domain (@domain.com), or * to block everyone.'
  }
  return isDuplicate(rules, trimmed) ? alreadyListed(trimmed) : undefined
}

const formatRuleDisplay = (rule: string): string => {
  const trimmed = rule.trim()
  if (trimmed === '*') {
    return 'All senders'
  }
  return rule
}

const BounceSenderInput = ({
  addLabel,
  addOnBlur,
  describedBy,
  draft,
  enterKeyHint,
  inputId,
  inputRef,
  invalid,
  label,
  onDraftChange,
  onInvalid,
  pendingHintId,
  placeholder = 'Email, @domain.com, or * for all',
  readOnly = false,
  readOnlyReason,
  rules,
  savedEntries,
  setRules,
  validate,
}: BounceSenderInputProps): React.ReactNode => {
  // Returns whether the entry was accepted, so a rejected one stays in the box to be fixed.
  const handleAdd = (value: string): boolean => {
    if (!setRules) return false
    const entry = value.trim()
    // A case-insensitive repeat adds nothing; leave it in the box rather than add a second chip.
    if (isDuplicate(rules, entry)) {
      onInvalid?.(entry)
      return false
    }
    if (validate) {
      if (!validate(entry)) {
        onInvalid?.(entry)
        return false
      }
      setRules([...rules, entry])
      return true
    }
    if (!validateBounceRule(entry)) {
      onInvalid?.(entry)
      return false
    }
    setRules([...rules, entry])
    return true
  }

  const handleDelete = (index: number): void => {
    if (!setRules) return
    setRules(rules.filter((_, i) => i !== index))
  }

  const labelStyle: React.CSSProperties = {
    color: 'var(--text-paper-muted)',
    fontFamily: 'Outfit, sans-serif',
    letterSpacing: '0.06em',
    // Matches the first chip row's height, so the label lines up with it when chips wrap.
    minHeight: '22px',
  }

  return (
    <div className="flex flex-wrap items-start gap-2 px-4 py-2">
      {label &&
        (inputId ? (
          <label
            className="flex flex-shrink-0 items-center text-xs font-medium uppercase"
            htmlFor={inputId}
            style={labelStyle}
          >
            {label}
          </label>
        ) : (
          <span className="flex flex-shrink-0 items-center text-xs font-medium uppercase" style={labelStyle}>
            {label}
          </span>
        ))}
      <div className="flex flex-1 flex-wrap items-center gap-1">
        {rules.map((rule, index) => (
          <Chip
            isNew={savedEntries ? !savedEntries.includes(rule) : undefined}
            key={index}
            label={formatRuleDisplay(rule)}
            onRemove={setRules ? () => handleDelete(index) : undefined}
            removeUnavailableReason={readOnly ? readOnlyReason : undefined}
          />
        ))}
        {setRules && (
          <ChipInput
            addLabel={addLabel}
            addOnBlur={addOnBlur}
            ariaLabel={inputId ? undefined : 'Sender to block'}
            describedBy={
              [describedBy, draft?.trim() ? pendingHintId : undefined].filter(Boolean).join(' ') || undefined
            }
            enterKeyHint={enterKeyHint}
            inputId={inputId}
            invalid={invalid}
            onAdd={handleAdd}
            onDraftChange={onDraftChange}
            placeholder={placeholder}
            readOnly={readOnly}
            readOnlyReason={readOnlyReason}
            ref={inputRef}
            value={draft}
          />
        )}
      </div>
    </div>
  )
}

export default BounceSenderInput
