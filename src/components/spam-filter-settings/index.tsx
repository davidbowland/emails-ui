import React, { useId } from 'react'

import BounceSenderInput, { alreadyListed } from '@components/bounce-sender-input'
import FieldError from '@components/ui/field-error'
import FormSection from '@components/ui/form-section'
import PendingHint from '@components/ui/pending-hint'
import RadioGroup from '@components/ui/radio-group'
import { isValidTrustedSender, SPAM_FILTER_LIST_LIMIT, toWords } from '@services/spam-impact'
import { SpamFilter, SpamSensitivity } from '@types'

export type SpamDraftKey = 'blockPhrases' | 'trustedSenders'

export interface SpamFilterSettingsProps {
  changed: boolean
  drafts: Record<SpamDraftKey, string>
  errors: Partial<Record<SpamDraftKey, string>>
  inputRef: (key: SpamDraftKey, element: HTMLInputElement | null) => void
  onChange: (next: SpamFilter) => void
  onDraftChange: (key: SpamDraftKey, text: string) => void
  onErrorChange: (key: SpamDraftKey, message: string | undefined) => void
  // Never disabled (spec G7): while the page saves, every control here is read-only, and a press
  // on a chip's remove control shows readOnlyReason.
  readOnly: boolean
  readOnlyReason?: string
  savedValue: SpamFilter
  value: SpamFilter
}

type ListKey = SpamDraftKey

const LIST_KEYS: ListKey[] = ['blockPhrases', 'trustedSenders']

// The API rejects a longer entry (AC-015); the UI says so before it gets that far.
const MAX_ENTRY_LENGTH = 100

const SENSITIVITIES: { description: string; label: string; value: SpamSensitivity }[] = [
  { description: 'Catches only obvious spam', label: 'Low', value: 'low' },
  { description: 'Catches most spam (recommended)', label: 'Medium', value: 'medium' },
  { description: 'Catches more spam, but may catch real mail', label: 'High', value: 'high' },
]

// Compared as words, the way mail is matched, so "Crypto!" and "crypto" count as the same phrase.
const samePhrase = (a: string, b: string): boolean => toWords(a).join(' ') === toWords(b).join(' ')

export const blockPhraseError = (phrases: string[], entry: string): string | undefined => {
  if (phrases.length >= SPAM_FILTER_LIST_LIMIT) {
    return `You've reached the limit of ${SPAM_FILTER_LIST_LIMIT} block phrases. Remove one to add another.`
  }
  if (entry.length > MAX_ENTRY_LENGTH) {
    return `That phrase is ${entry.length} characters. Shorten it to ${MAX_ENTRY_LENGTH} or fewer.`
  }
  // A phrase of symbols alone has no words, so it could never match anything.
  if (toWords(entry).length === 0) {
    return 'Add at least one letter or number.'
  }
  return phrases.some((phrase) => samePhrase(phrase, entry)) ? alreadyListed(entry) : undefined
}

export const trustedSenderError = (senders: string[], entry: string): string | undefined => {
  if (senders.length >= SPAM_FILTER_LIST_LIMIT) {
    return `You've reached the limit of ${SPAM_FILTER_LIST_LIMIT} trusted senders. Remove one to add another.`
  }
  if (entry === '*') {
    return 'Trusting everyone would turn the filter off. Enter an address or a domain.'
  }
  if (entry.length > MAX_ENTRY_LENGTH) {
    return `That entry is ${entry.length} characters. Shorten it to ${MAX_ENTRY_LENGTH} or fewer.`
  }
  // The API's own rule, so nothing accepted here is refused on save.
  if (!isValidTrustedSender(entry)) {
    return 'Enter an address (user@domain.com) or a domain (@domain.com).'
  }
  return senders.some((sender) => sender.toLowerCase() === entry.toLowerCase()) ? alreadyListed(entry) : undefined
}

const LISTS: Record<
  ListKey,
  {
    addLabel: string
    errorFor: (entries: string[], entry: string) => string | undefined
    helper: string
    label: string
    name: string
    placeholder: string
  }
> = {
  blockPhrases: {
    addLabel: 'Add block phrase',
    errorFor: blockPhraseError,
    helper:
      'Each entry is matched as a whole phrase, so "app development" won\'t match "app" on its own. Mail whose subject or body contains any of them goes to Spam.',
    label: 'Block phrases:',
    name: 'block phrases',
    placeholder: 'Add a word or phrase, then press Enter',
  },
  trustedSenders: {
    addLabel: 'Add trusted sender',
    errorFor: trustedSenderError,
    helper:
      'Trust senders by address (user@domain.com) or domain (@domain.com, which covers its subdomains). Their mail skips your spam filter when we can verify it really came from them, but mail that fails our virus or spam scan on arrival still goes to Spam.',
    label: 'Trusted senders:',
    name: 'trusted senders',
    placeholder: 'Email or @domain.com',
  },
}

const textStyle: React.CSSProperties = { color: 'var(--text-paper-muted)', fontFamily: 'Outfit, sans-serif' }

const SpamFilterSettings = ({
  changed,
  drafts,
  errors,
  inputRef,
  onChange,
  onDraftChange,
  onErrorChange,
  readOnly,
  readOnlyReason,
  savedValue,
  value,
}: SpamFilterSettingsProps): React.ReactNode => {
  const idPrefix = useId()
  const headingId = `${idPrefix}-heading`

  const renderList = (key: ListKey): React.ReactNode => {
    const list = LISTS[key]
    const error = errors[key]
    const inputId = `${idPrefix}-${key}-input`
    const errorId = `${idPrefix}-${key}-error`
    const helperId = `${idPrefix}-${key}-helper`
    const hintId = `${idPrefix}-${key}-hint`
    return (
      <div className="mt-5">
        {/* The error is also said in words beside an icon, so the accent border is never the only signal. */}
        <div className="rounded-md" style={{ border: `1px solid ${error ? 'var(--accent)' : 'var(--paper-border)'}` }}>
          <BounceSenderInput
            addLabel={list.addLabel}
            addOnBlur={false}
            describedBy={error ? `${errorId} ${helperId}` : helperId}
            draft={drafts[key]}
            enterKeyHint="done"
            inputId={inputId}
            inputRef={(element: HTMLInputElement | null) => inputRef(key, element)}
            invalid={error !== undefined}
            label={list.label}
            onDraftChange={(text: string) => onDraftChange(key, text)}
            onInvalid={(entry: string) => onErrorChange(key, list.errorFor(value[key], entry) ?? alreadyListed(entry))}
            pendingHintId={hintId}
            placeholder={list.placeholder}
            readOnly={readOnly}
            readOnlyReason={readOnlyReason}
            rules={value[key]}
            savedEntries={savedValue[key]}
            setRules={(entries: string[]) => {
              onErrorChange(key, undefined)
              onChange({ ...value, [key]: entries })
            }}
            validate={(entry: string) => list.errorFor(value[key], entry) === undefined}
          />
        </div>
        {drafts[key].trim() && <PendingHint id={hintId}>Not added yet. Press Enter or choose Add.</PendingHint>}
        <FieldError id={errorId} message={error} />
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="text-sm" id={helperId} style={{ ...textStyle, flex: '1 1 18rem', margin: 0 }}>
            {list.helper}
          </p>
          <span
            className="text-xs"
            style={{ color: 'var(--text-paper-muted)', fontFamily: 'IBM Plex Mono, monospace', whiteSpace: 'nowrap' }}
          >
            {value[key].length} of {SPAM_FILTER_LIST_LIMIT}
            <span className="sr-only"> {list.name}</span>
          </span>
        </div>
      </div>
    )
  }

  return (
    <FormSection heading="Spam filter" headingId={headingId} status={changed ? 'unsaved' : undefined}>
      <p className="mb-3 text-sm" style={textStyle}>
        Spam goes to your Spam folder. We don&apos;t forward it or send a notification for it.
      </p>

      <RadioGroup
        help={
          <p className="mt-1 mb-1 text-xs" style={textStyle}>
            Every new email gets a spam score from warning signs like hidden characters in your domain, placeholder text
            such as {'{{First Name}}'}, and &quot;reply NO to stop&quot; lines. Sensitivity sets how high that score
            must be before mail goes to Spam. Mail that fails our spam or virus scan on arrival always goes to Spam.
          </p>
        }
        legend="Sensitivity"
        name={`${idPrefix}-sensitivity`}
        onChange={(next: string) => {
          const choice = SENSITIVITIES.find((sensitivity) => sensitivity.value === next)
          if (choice) {
            onChange({ ...value, sensitivity: choice.value })
          }
        }}
        options={SENSITIVITIES}
        readOnly={readOnly}
        value={value.sensitivity}
      />

      {LIST_KEYS.map((key) => (
        <React.Fragment key={key}>{renderList(key)}</React.Fragment>
      ))}
    </FormSection>
  )
}

export default SpamFilterSettings
