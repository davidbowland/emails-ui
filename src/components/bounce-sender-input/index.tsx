import React from 'react'

import { RuleChip, RuleInput } from './elements'

type BounceRuleSetter = (value: string[]) => void

export interface BounceSenderInputProps {
  label: string
  rules: string[]
  setRules?: BounceRuleSetter
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

const formatRuleDisplay = (rule: string): string => {
  const trimmed = rule.trim()
  if (trimmed === '*') {
    return 'All senders'
  }
  return rule
}

const BounceSenderInput = ({ label, rules, setRules }: BounceSenderInputProps): React.ReactNode => {
  const handleAdd = (value: string): void => {
    if (!setRules) return
    const allValues = [...rules, value]
    const validRules = allValues.filter(validateBounceRule)
    setRules(validRules)
  }

  const handleDelete = (index: number): void => {
    if (!setRules) return
    setRules(rules.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2">
      {label && (
        <span
          className="flex-shrink-0 text-xs font-medium uppercase"
          style={{
            color: 'var(--text-paper-muted)',
            fontFamily: 'Outfit, sans-serif',
            letterSpacing: '0.06em',
            paddingTop: '2px',
          }}
        >
          {label}
        </span>
      )}
      <div className="flex flex-1 flex-wrap items-center gap-1">
        {rules.map((rule, index) => (
          <RuleChip
            key={index}
            label={formatRuleDisplay(rule)}
            onDelete={setRules ? () => handleDelete(index) : undefined}
          />
        ))}
        {setRules && <RuleInput disabled={false} onAdd={handleAdd} />}
      </div>
    </div>
  )
}

export default BounceSenderInput
