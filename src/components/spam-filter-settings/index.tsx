import { AlertCircle } from 'lucide-react'
import React, { useId, useImperativeHandle, useRef, useState } from 'react'

import BounceSenderInput from '@components/bounce-sender-input'
import { SPAM_FILTER_LIST_LIMIT, toWords } from '@services/spam-impact'
import { SpamFilter, SpamSensitivity } from '@types'

export interface SpamFilterSettingsHandle {
  // Adds whatever is still typed in either box, so Save never drops an entry the owner can see. An
  // exact repeat of an entry already listed adds nothing, so it is cleared from its box silently. Returns the filter to save, or undefined when a typed entry is rejected: its error is shown and
  // its box focused, and nothing should be saved until it is fixed or cleared.
  commitDrafts: () => SpamFilter | undefined
}

export interface SpamFilterSettingsProps {
  disabled: boolean
  onChange: (next: SpamFilter) => void
  ref?: React.Ref<SpamFilterSettingsHandle>
  value: SpamFilter
}

type ListKey = 'blockPhrases' | 'trustedSenders'

const LIST_KEYS: ListKey[] = ['blockPhrases', 'trustedSenders']

// The API rejects a longer entry (AC-015); the UI says so before it gets that far.
const MAX_ENTRY_LENGTH = 100

const SENSITIVITIES: { helper: string; label: string; value: SpamSensitivity }[] = [
  { helper: 'Catches only obvious spam', label: 'Low', value: 'low' },
  { helper: 'Catches most spam (recommended)', label: 'Medium', value: 'medium' },
  { helper: 'Catches more spam, but may catch real mail', label: 'High', value: 'high' },
]

const alreadyListed = (entry: string): string => `“${entry}” is already on your list.`

// Compared as words, the way mail is matched, so "Crypto!" and "crypto" count as the same phrase.
const samePhrase = (a: string, b: string): boolean => toWords(a).join(' ') === toWords(b).join(' ')

// The same test the chip input uses to refuse a repeat without a word.
const isExactRepeat = (entries: string[], entry: string): boolean =>
  entries.some((existing) => existing.trim().toLowerCase() === entry.toLowerCase())

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

// user@domain.com, @domain.com or domain.com -- the forms the inbound sender match understands.
const isAddressOrDomain = (entry: string): boolean => {
  const atIndex = entry.indexOf('@')
  const domain = entry.slice(atIndex + 1)
  const dotIndex = domain.indexOf('.')
  return (
    !/\s/.test(entry) &&
    atIndex === entry.lastIndexOf('@') &&
    dotIndex > 0 &&
    dotIndex < domain.length - 1 &&
    !domain.endsWith('.')
  )
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
  if (!isAddressOrDomain(entry)) {
    return 'Enter an address (user@domain.com) or a domain (@domain.com).'
  }
  return senders.some((sender) => sender.toLowerCase() === entry.toLowerCase()) ? alreadyListed(entry) : undefined
}

const LISTS: Record<
  ListKey,
  {
    errorFor: (entries: string[], entry: string) => string | undefined
    helper: string
    label: string
    name: string
    placeholder: string
  }
> = {
  blockPhrases: {
    errorFor: blockPhraseError,
    helper:
      'Each entry is matched as a whole phrase, so "app development" won\'t match "app" on its own. Mail whose subject or body contains any of them goes to Spam.',
    label: 'Block phrases:',
    name: 'block phrases',
    placeholder: 'Add a word or phrase, then press Enter',
  },
  trustedSenders: {
    errorFor: trustedSenderError,
    helper:
      'Trust senders by address (user@domain.com) or domain (@domain.com, which covers its subdomains). Their mail skips your spam filter when we can verify it really came from them, but mail that fails our virus or spam scan on arrival still goes to Spam.',
    label: 'Trusted senders:',
    name: 'trusted senders',
    placeholder: 'Email or @domain.com',
  },
}

const textStyle: React.CSSProperties = { color: 'var(--text-paper-muted)', fontFamily: 'Outfit, sans-serif' }

const eyebrowStyle: React.CSSProperties = { ...textStyle, letterSpacing: '0.1em' }

const SpamFilterSettings = ({ disabled, onChange, ref, value }: SpamFilterSettingsProps): React.ReactNode => {
  const [errors, setErrors] = useState<Partial<Record<ListKey, string>>>({})
  const inputRefs = useRef<Partial<Record<ListKey, HTMLInputElement | null>>>({})
  const idPrefix = useId()
  const headingId = `${idPrefix}-heading`
  const sensitivityHelpId = `${idPrefix}-sensitivity-help`

  const setError = (key: ListKey, error: string | undefined): void =>
    setErrors((current) => ({ ...current, [key]: error }))

  const setEntries = (key: ListKey, entries: string[]): void => {
    setError(key, undefined)
    onChange({ ...value, [key]: entries })
  }

  // The chip input refuses an exact repeat without saying why. Whatever is still in the box after
  // Enter or blur was refused, so the reason is shown here; an emptied box has nothing left to fix.
  const explainRefusal = (key: ListKey, event: React.SyntheticEvent): void => {
    const target = event.target
    if (target instanceof HTMLInputElement) {
      const entry = target.value.trim()
      setError(key, entry ? LISTS[key].errorFor(value[key], entry) : undefined)
    }
  }

  const clearErrorWhenEmptied = (key: ListKey, event: React.ChangeEvent): void => {
    const target = event.target
    if (target instanceof HTMLInputElement && !target.value.trim()) {
      setError(key, undefined)
    }
  }

  useImperativeHandle(
    ref,
    () => ({
      commitDrafts: (): SpamFilter | undefined => {
        const drafts = LIST_KEYS.map((key) => ({ input: inputRefs.current[key], key }))
          .filter(
            (field): field is { input: HTMLInputElement; key: ListKey } => field.input instanceof HTMLInputElement,
          )
          .map(({ input, key }) => {
            const draft = input.value.trim()
            const repeat = draft !== '' && isExactRepeat(value[key], draft)
            const error = draft && !repeat ? LISTS[key].errorFor(value[key], draft) : undefined
            return { draft, error, input, key, repeat }
          })
        const rejected = drafts.filter((draft) => draft.error !== undefined)
        if (rejected.length > 0) {
          setErrors((current) => ({ ...current, ...Object.fromEntries(rejected.map((d) => [d.key, d.error])) }))
          rejected[0].input.focus()
          return undefined
        }
        const typed = drafts.filter((draft) => draft.draft)
        typed.forEach(({ input }) => (input.value = ''))
        if (typed.length > 0) {
          setErrors({})
        }
        const pending = typed.filter((draft) => !draft.repeat)
        if (pending.length === 0) {
          return value
        }
        const next = pending.reduce<SpamFilter>(
          (filter, { draft, key }) => ({ ...filter, [key]: [...filter[key], draft] }),
          value,
        )
        onChange(next)
        return next
      },
    }),
    [onChange, value],
  )

  const renderList = (key: ListKey): React.ReactNode => {
    const list = LISTS[key]
    const error = errors[key]
    const inputId = `${idPrefix}-${key}-input`
    const errorId = `${idPrefix}-${key}-error`
    const helperId = `${idPrefix}-${key}-helper`
    return (
      <div
        className="mt-5"
        onBlur={(event: React.FocusEvent) => explainRefusal(key, event)}
        onChange={(event: React.ChangeEvent) => clearErrorWhenEmptied(key, event)}
        onKeyDown={(event: React.KeyboardEvent) => event.key === 'Enter' && explainRefusal(key, event)}
      >
        {/* The error is also said in words beside an icon, so the accent border is never the only signal. */}
        <div className="rounded-md" style={{ border: `1px solid ${error ? 'var(--accent)' : 'var(--paper-border)'}` }}>
          <BounceSenderInput
            describedBy={error ? `${errorId} ${helperId}` : helperId}
            disabled={disabled}
            enterKeyHint="done"
            inputId={inputId}
            inputRef={(element: HTMLInputElement | null) => {
              inputRefs.current[key] = element
            }}
            invalid={error !== undefined}
            label={list.label}
            onInvalid={(entry: string) => setError(key, list.errorFor(value[key], entry))}
            placeholder={list.placeholder}
            rules={value[key]}
            setRules={(entries: string[]) => setEntries(key, entries)}
            validate={(entry: string) => list.errorFor(value[key], entry) === undefined}
          />
        </div>
        {/* Mounted whether or not there is an error: a live region created in the same commit as its
            content is reliably not announced. */}
        <p
          className="flex items-start gap-1.5 text-sm"
          id={errorId}
          role="status"
          style={{ color: 'var(--text-paper)', fontFamily: 'Outfit, sans-serif', marginTop: error ? '8px' : 0 }}
        >
          {error && (
            <>
              <AlertCircle
                aria-hidden="true"
                size={14}
                strokeWidth={2}
                style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '3px' }}
              />
              <span>{error}</span>
            </>
          )}
        </p>
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
    <section aria-labelledby={headingId}>
      <h2 className="mb-1 text-xs font-semibold uppercase" id={headingId} style={eyebrowStyle}>
        Spam filter
      </h2>
      <p className="mb-3 text-sm" style={textStyle}>
        Spam goes to your Spam folder. We don&apos;t forward it or send a notification for it.
      </p>

      <fieldset aria-describedby={sensitivityHelpId} style={{ border: 'none', margin: 0, padding: 0 }}>
        <legend className="text-xs font-semibold uppercase" style={eyebrowStyle}>
          Sensitivity
        </legend>
        <p className="mt-1 mb-1 text-xs" id={sensitivityHelpId} style={textStyle}>
          Every new email gets a spam score from warning signs like hidden characters in your domain, placeholder text
          such as {'{{First Name}}'}, and &quot;reply NO to stop&quot; lines. Sensitivity sets how high that score must
          be before mail goes to Spam. Mail that fails our spam or virus scan on arrival always goes to Spam.
        </p>
        {SENSITIVITIES.map((choice) => {
          const choiceHelpId = `${idPrefix}-sensitivity-${choice.value}-help`
          const choiceLabelId = `${idPrefix}-sensitivity-${choice.value}-label`
          return (
            // The label wraps the input so the whole 44px row is the target.
            <label
              key={choice.value}
              style={{
                alignItems: 'center',
                color: 'var(--text-paper)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                fontFamily: 'Outfit, sans-serif',
                fontSize: '14px',
                gap: '10px',
                minHeight: '44px',
              }}
            >
              <input
                aria-describedby={choiceHelpId}
                // Named by the level alone; its helper is the description, not part of the name.
                aria-labelledby={choiceLabelId}
                checked={value.sensitivity === choice.value}
                disabled={disabled}
                name={`${idPrefix}-sensitivity`}
                onChange={() => onChange({ ...value, sensitivity: choice.value })}
                style={{ flexShrink: 0, margin: 0 }}
                type="radio"
                value={choice.value}
              />
              <span>
                <span id={choiceLabelId}>{choice.label}</span>
                <span className="block text-xs" id={choiceHelpId} style={textStyle}>
                  {choice.helper}
                </span>
              </span>
            </label>
          )
        })}
      </fieldset>

      {LIST_KEYS.map((key) => (
        <React.Fragment key={key}>{renderList(key)}</React.Fragment>
      ))}
    </section>
  )
}

export default SpamFilterSettings
