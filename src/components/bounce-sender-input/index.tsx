import React from 'react'

import { RuleChip, RuleInput, RuleInputProps } from './elements'

type BounceRuleSetter = (value: string[]) => void

export interface BounceSenderInputProps {
  // Points at helper text or an inline error, so a screen reader hears it with the field.
  describedBy?: string
  disabled?: boolean
  enterKeyHint?: RuleInputProps['enterKeyHint']
  // When given, the label becomes a <label> for this id and names the input.
  inputId?: string
  // Lets a caller read or clear what is still typed in the box (e.g. to commit it on Save).
  inputRef?: RuleInputProps['inputRef']
  invalid?: boolean
  label: string
  // Called with the trimmed entry when it fails validation, so the caller can show why.
  onInvalid?: (value: string) => void
  placeholder?: string
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

const formatRuleDisplay = (rule: string): string => {
  const trimmed = rule.trim()
  if (trimmed === '*') {
    return 'All senders'
  }
  return rule
}

const BounceSenderInput = ({
  describedBy,
  disabled = false,
  enterKeyHint,
  inputId,
  inputRef,
  invalid,
  label,
  onInvalid,
  placeholder = 'Email, @domain.com, or * for all',
  rules,
  setRules,
  validate,
}: BounceSenderInputProps): React.ReactNode => {
  // Returns whether the entry was accepted, so a rejected one stays in the box to be fixed.
  const handleAdd = (value: string): boolean => {
    if (!setRules) return false
    const entry = value.trim()
    // A case-insensitive repeat adds nothing; leave it in the box rather than add a second chip.
    if (isDuplicate(rules, entry)) return false
    if (validate) {
      if (!validate(entry)) {
        onInvalid?.(entry)
        return false
      }
      setRules([...rules, entry])
      return true
    }
    const accepted = validateBounceRule(entry)
    if (!accepted) {
      onInvalid?.(entry)
    }
    const allValues = [...rules, entry]
    const validRules = allValues.filter(validateBounceRule)
    setRules(validRules)
    return accepted
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
          <RuleChip
            disabled={disabled}
            key={index}
            label={formatRuleDisplay(rule)}
            onDelete={setRules ? () => handleDelete(index) : undefined}
          />
        ))}
        {setRules && (
          <RuleInput
            ariaLabel={inputId ? undefined : 'Sender to block'}
            describedBy={describedBy}
            disabled={disabled}
            enterKeyHint={enterKeyHint}
            inputId={inputId}
            inputRef={inputRef}
            invalid={invalid}
            onAdd={handleAdd}
            placeholder={placeholder}
          />
        )}
      </div>
    </div>
  )
}

export default BounceSenderInput
