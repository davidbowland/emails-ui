import { Check, TriangleAlert } from 'lucide-react'
import React, { useEffect, useId, useMemo, useState } from 'react'

import ConfirmDialog from '@components/confirm-dialog'
import { getAccount, postSpamSuggestions, putAccount } from '@services/emails'
import { applySuggestions, matchInboxSubjects, SPAM_FILTER_LIST_LIMIT, wouldExceedLimits } from '@services/spam-impact'
import { DEFAULT_SPAM_FILTER, EmailBatch, HttpError, SpamFilter, SpamSuggestion, SpamSuggestionKind } from '@types'

export interface SpamSuggestionsProps {
  accountId: string
  emailId: string
  inboxEmails: EmailBatch[]
  onApplied: (count: number) => void
  onClose: () => void
  open: boolean
}

type DialogState = 'loading' | 'results' | 'zero' | 'quota' | 'unavailable' | 'forbidden' | 'applying'

const SHOWN_SUBJECTS = 3

const KINDS: ReadonlySet<SpamSuggestionKind> = new Set(['addBlockPhrase', 'removeTrustedSender', 'raiseSensitivity'])

const STATE_MESSAGES: Readonly<Partial<Record<DialogState, { detail: string; lead: string }>>> = {
  forbidden: {
    detail: "It's still in Spam, and you can change your spam filter anytime in Settings.",
    lead: "Rule suggestions aren't available for this email.",
  },
  quota: {
    detail: 'Try again tomorrow. This email is still in Spam, and you can change your spam filter anytime in Settings.',
    lead: "You've reached today's limit for rule suggestions.",
  },
  unavailable: {
    detail: 'Try again later. This email is still in Spam, and you can change your spam filter anytime in Settings.',
    lead: "Rule suggestions aren't available right now.",
  },
  zero: {
    detail: "It's still in Spam. To catch more mail like it, add a block phrase under Spam filter in Settings.",
    lead: "We don't have any suggestions for this email.",
  },
}

const APPLY_FAILURE = "We couldn't save those changes. Your picks are still here — try again."

const OVER_LIMIT: Readonly<Record<'blockPhrases' | 'trustedSenders', string>> = {
  blockPhrases: `These would put your block phrases over the limit of ${SPAM_FILTER_LIST_LIMIT}. Pick fewer, or make room under Spam filter in Settings and add them there.`,
  trustedSenders: `These would put your trusted senders over the limit of ${SPAM_FILTER_LIST_LIMIT}. Pick fewer, or make room under Spam filter in Settings and add them there.`,
}

const plural = (count: number, one: string, many: string): string => (count === 1 ? one : many)

const capitalize = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1)

const changeLabel = (suggestion: SpamSuggestion): React.ReactNode => {
  switch (suggestion.kind) {
    case 'addBlockPhrase':
      return <>Add “{suggestion.value}” to block phrases</>
    case 'removeTrustedSender':
      return (
        <>
          Remove <span className="font-mono">{suggestion.value}</span> from trusted senders
        </>
      )
    default:
      return <>Raise sensitivity to {capitalize(suggestion.value)}</>
  }
}

// Only the daily limit gets its own message; any other 429 (throttling) reads as unavailable.
const errorState = (error: unknown): DialogState => {
  const httpError = error as HttpError | undefined
  return httpError?.status === 403
    ? 'forbidden'
    : httpError?.status === 429 && httpError.code === 'DAILY_LIMIT'
      ? 'quota'
      : 'unavailable'
}

const isSuggestion = (value: unknown): value is SpamSuggestion => {
  const candidate = value as Partial<Record<keyof SpamSuggestion, unknown>> | null | undefined
  return (
    typeof candidate?.id === 'string' &&
    typeof candidate.kind === 'string' &&
    typeof candidate.value === 'string' &&
    typeof candidate.reason === 'string' &&
    KINDS.has(candidate.kind as SpamSuggestionKind)
  )
}

// Well-formed suggestions of a known kind, first of each id only.
const validSuggestions = (received: unknown): SpamSuggestion[] =>
  (Array.isArray(received) ? received : [])
    .filter(isSuggestion)
    .filter((suggestion, index, all) => all.findIndex(({ id }) => id === suggestion.id) === index)

// Add-only and remove-only lists, so a change of length or level is a change of filter.
const filterChanged = (before: SpamFilter, after: SpamFilter): boolean =>
  before.blockPhrases.length !== after.blockPhrases.length ||
  before.trustedSenders.length !== after.trustedSenders.length ||
  before.sensitivity !== after.sensitivity

// The filter with the picks applied, and how many of them changed it.
const applyCounted = (base: SpamFilter, picks: SpamSuggestion[]): { changed: number; spamFilter: SpamFilter } =>
  picks.reduce(
    ({ changed, spamFilter }, suggestion) => {
      const next = applySuggestions(spamFilter, [suggestion])
      return { changed: changed + (filterChanged(spamFilter, next) ? 1 : 0), spamFilter: next }
    },
    { changed: 0, spamFilter: base },
  )

const ImpactLine = ({
  id,
  subjects,
  suggestion,
}: {
  id: string
  subjects: string[]
  suggestion: SpamSuggestion
}): React.ReactNode => {
  if (subjects.length > 0) {
    return (
      <span className="mt-1.5 flex items-start gap-1.5 text-xs" id={id} style={{ color: 'var(--text-paper)' }}>
        <TriangleAlert
          aria-hidden="true"
          className="mt-px flex-shrink-0"
          size={12}
          strokeWidth={2}
          style={{ color: 'var(--accent)' }}
        />
        <span className="min-w-0">
          Matches {subjects.length} Inbox {plural(subjects.length, 'subject', 'subjects')}:
          {/* A list inside a label is invalid HTML, so these are spans drawn as list items. */}
          <span className="mt-0.5 list-disc pl-4" style={{ color: 'var(--text-paper-muted)', display: 'block' }}>
            {subjects.slice(0, SHOWN_SUBJECTS).map((subject, index) => (
              <span key={index} style={{ display: 'list-item', overflowWrap: 'anywhere' }}>
                {subject}
              </span>
            ))}
            {subjects.length > SHOWN_SUBJECTS && (
              <span style={{ display: 'list-item' }}>and {subjects.length - SHOWN_SUBJECTS} more</span>
            )}
          </span>
        </span>
      </span>
    )
  }
  if (suggestion.kind === 'raiseSensitivity' && suggestion.value === 'high') {
    return (
      <span className="mt-1.5 flex items-start gap-1.5 text-xs" id={id} style={{ color: 'var(--text-paper)' }}>
        <TriangleAlert
          aria-hidden="true"
          className="mt-px flex-shrink-0"
          size={12}
          strokeWidth={2}
          style={{ color: 'var(--accent)' }}
        />
        <span>Applies to new mail only. High may catch real mail.</span>
      </span>
    )
  }
  return (
    <span className="mt-1.5 flex items-start gap-1.5 text-xs" id={id}>
      <Check aria-hidden="true" className="mt-px flex-shrink-0" size={12} strokeWidth={2} />
      <span>{suggestion.kind === 'addBlockPhrase' ? 'No Inbox subjects match' : 'Applies to new mail only'}</span>
    </span>
  )
}

const SpamSuggestions = ({
  accountId,
  emailId,
  inboxEmails,
  onApplied,
  onClose,
  open,
}: SpamSuggestionsProps): React.ReactNode => {
  const [state, setState] = useState<DialogState>('loading')
  const [suggestions, setSuggestions] = useState<SpamSuggestion[]>([])
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set())
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const baseId = useId()
  const introId = `${baseId}-intro`

  useEffect(() => {
    if (!open) {
      // Reset while closed, so the next opening starts at loading and the dialog's initial focus
      // never lands on a row from last time.
      setState('loading')
      setSuggestions([])
      setPicked(new Set())
      setErrorMessage(undefined)
      return
    }
    let current = true
    postSpamSuggestions(accountId, emailId)
      .then(({ suggestions: received }) => {
        if (!current) return
        // The API validates these; anything malformed, of an unknown kind, or repeated is still dropped here.
        const valid = validSuggestions(received)
        setSuggestions(valid)
        setState(valid.length > 0 ? 'results' : 'zero')
      })
      .catch((error: unknown) => {
        if (!current) return
        console.error('Error fetching spam suggestions', error)
        setState(errorState(error))
      })
    return () => {
      current = false
    }
  }, [open, accountId, emailId])

  const impacts = useMemo(
    () =>
      new Map(
        suggestions.map((suggestion) => [
          suggestion.id,
          suggestion.kind === 'addBlockPhrase' ? matchInboxSubjects(suggestion.value, inboxEmails) : [],
        ]),
      ),
    [suggestions, inboxEmails],
  )

  const pickedSuggestions = suggestions.filter((suggestion) => picked.has(suggestion.id))
  const pickedCount = pickedSuggestions.length
  const matchingPicks = pickedSuggestions.filter((suggestion) => (impacts.get(suggestion.id) ?? []).length > 0).length
  const applying = state === 'applying'
  const showRows = state === 'results' || applying
  const hasPhrases = suggestions.some((suggestion) => suggestion.kind === 'addBlockPhrase')

  const togglePick = (id: string): void => {
    if (applying) return
    setPicked((previous) => {
      const next = new Set(previous)
      if (!next.delete(id)) next.add(id)
      return next
    })
  }

  const handleClose = (): void => {
    if (!applying) onClose()
  }

  const handleApply = async (): Promise<void> => {
    if (pickedCount === 0 || applying) return
    setState('applying')
    setErrorMessage(undefined)
    try {
      // Re-read right before the PUT so an edit made elsewhere is not overwritten.
      const account = await getAccount(accountId)
      const before = account.spamFilter ?? DEFAULT_SPAM_FILTER
      // Only picks that change the filter count: a phrase already there, say, is no change.
      const { changed, spamFilter } = applyCounted(before, pickedSuggestions)
      const overLimit = wouldExceedLimits(before, spamFilter)
      if (overLimit) {
        setErrorMessage(OVER_LIMIT[overLimit])
        setState('results')
        return
      }
      await putAccount(accountId, { ...account, spamFilter })
      onApplied(changed)
    } catch (error: unknown) {
      console.error('Error applying spam suggestions', error)
      setErrorMessage(APPLY_FAILURE)
      setState('results')
    }
  }

  const primaryLabel =
    pickedCount === 0
      ? 'Apply changes'
      : applying
        ? 'Applying…'
        : `Apply ${pickedCount} ${plural(pickedCount, 'change', 'changes')}${matchingPicks > 0 ? ' anyway' : ''}`

  // One first button for every state, so the element that holds focus while loading is the same
  // one after the results (Cancel) or a message (Close) arrive.
  const closesOnly = !showRows && state !== 'loading'
  const footer = (
    <div className="flex flex-shrink-0 justify-end gap-2">
      <button
        aria-disabled={applying || undefined}
        className={`${closesOnly ? 'btn-accent' : 'btn-ghost-paper'} rounded-md px-4 py-2 text-sm font-medium transition-all`}
        onClick={handleClose}
        style={{ fontFamily: 'Outfit, sans-serif' }}
        type="button"
      >
        {closesOnly ? 'Close' : 'Cancel'}
      </button>
      {showRows && (
        <button
          aria-describedby={pickedCount === 0 ? introId : undefined}
          aria-disabled={pickedCount === 0 || applying || undefined}
          className="btn-accent rounded-md px-4 py-2 text-sm font-medium transition-all"
          onClick={handleApply}
          style={{ fontFamily: 'Outfit, sans-serif' }}
          type="button"
        >
          {primaryLabel}
        </button>
      )}
    </div>
  )

  const message = STATE_MESSAGES[state]

  return (
    <ConfirmDialog footer={footer} onCancel={handleClose} open={open} scrollable title="Suggested rule changes">
      {/* Mounted for every state, so each change of state is announced. */}
      <div role="status">
        {state === 'loading' && (
          <div className="flex flex-col items-center gap-3.5 pb-2 pt-5 text-center">
            <div
              aria-hidden="true"
              className="h-8 w-8 animate-spin rounded-full"
              style={{ border: '2px solid var(--paper-border)', borderTopColor: 'var(--accent)' }}
            />
            <p style={{ color: 'var(--text-paper)' }}>Reading this email…</p>
          </div>
        )}
        {message && (
          <>
            <p style={{ color: 'var(--text-paper)' }}>{message.lead}</p>
            <p className="mt-2">{message.detail}</p>
          </>
        )}
        {showRows && (
          <span className="sr-only">
            {suggestions.length} suggested {plural(suggestions.length, 'change', 'changes')}.
          </span>
        )}
      </div>
      {/* Mounted for every state too, so an error added later is announced. Kept in the dialog:
            anything outside it is inert while the dialog is open. */}
      <div role="alert">
        {errorMessage && (
          <p
            className="mb-3 flex items-start gap-2 rounded-[10px] px-3 py-2.5 text-[13px] leading-[18px]"
            style={{
              background: 'var(--accent-subtle)',
              border: '1px solid var(--accent-border)',
              color: 'var(--text-paper)',
            }}
          >
            <TriangleAlert
              aria-hidden="true"
              className="mt-0.5 flex-shrink-0"
              size={14}
              strokeWidth={2}
              style={{ color: 'var(--accent)' }}
            />
            <span style={{ overflowWrap: 'anywhere' }}>{errorMessage}</span>
          </p>
        )}
      </div>
      {showRows && (
        <>
          <p className="mb-3" id={introId}>
            Pick the changes you want. Nothing is saved until you apply them.
          </p>
          {matchingPicks > 0 && (
            <div
              className="mb-3 flex items-start gap-2 rounded-[10px] px-3 py-2.5 text-[13px] leading-[18px]"
              role="note"
              style={{
                background: 'var(--accent-subtle)',
                border: '1px solid var(--accent-border)',
                color: 'var(--text-paper)',
              }}
            >
              <TriangleAlert
                aria-hidden="true"
                className="mt-0.5 flex-shrink-0"
                size={14}
                strokeWidth={2}
                style={{ color: 'var(--accent)' }}
              />
              <span>
                {matchingPicks === 1
                  ? 'A phrase you picked matches emails in your Inbox. Those emails stay put, but new mail containing it will go to Spam.'
                  : 'Phrases you picked match emails in your Inbox. Those emails stay put, but new mail containing them will go to Spam.'}
              </span>
            </div>
          )}
          <ul className="flex flex-col gap-2">
            {suggestions.map((suggestion, index) => {
              const labelId = `${baseId}-${index}-label`
              const reasonId = `${baseId}-${index}-reason`
              const impactId = `${baseId}-${index}-impact`
              const checked = picked.has(suggestion.id)
              return (
                <li key={suggestion.id}>
                  <label
                    className="flex min-h-11 cursor-pointer items-start gap-2.5 rounded-[10px] px-3 py-2.5"
                    style={{
                      background: checked
                        ? 'linear-gradient(0deg, var(--accent-subtle), var(--accent-subtle)), var(--paper-surface)'
                        : 'var(--paper-surface)',
                      border: `1px solid ${checked ? 'var(--accent-border)' : 'var(--paper-border)'}`,
                    }}
                  >
                    <input
                      aria-describedby={`${reasonId} ${impactId}`}
                      aria-disabled={applying || undefined}
                      aria-labelledby={labelId}
                      checked={checked}
                      className="mt-0.5 h-4 w-4 flex-shrink-0"
                      onChange={() => togglePick(suggestion.id)}
                      style={{ accentColor: 'var(--accent-deep)' }}
                      type="checkbox"
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block text-sm font-medium"
                        id={labelId}
                        style={{ color: 'var(--text-paper)', overflowWrap: 'anywhere' }}
                      >
                        {changeLabel(suggestion)}
                      </span>
                      <span className="mt-0.5 block text-xs" id={reasonId}>
                        {suggestion.reason}
                      </span>
                      <ImpactLine id={impactId} subjects={impacts.get(suggestion.id) ?? []} suggestion={suggestion} />
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
          {hasPhrases && (
            <p className="mt-3 text-xs">
              We checked your Inbox subjects only. New mail with these phrases in the body will go to Spam too.
            </p>
          )}
        </>
      )}
    </ConfirmDialog>
  )
}

export default SpamSuggestions
