import { Check, TriangleAlert } from 'lucide-react'
import React, { useEffect, useId, useState } from 'react'

import ConfirmDialog from '@components/confirm-dialog'
import {
  ImpactFootnote,
  impactSummaryIds,
  isSpamImpactResponse,
  PhraseImpact,
  PhraseImpactFailed,
  PhraseImpactPending,
} from '@components/phrase-impact'
import { getAccount, postSpamImpact, postSpamSuggestions, putAccount } from '@services/emails'
import { applySuggestions, SPAM_FILTER_LIST_LIMIT, wouldExceedLimits } from '@services/spam-impact'
import {
  DEFAULT_SPAM_FILTER,
  HttpError,
  SpamFilter,
  SpamImpactResponse,
  SpamSuggestion,
  SpamSuggestionKind,
} from '@types'

export interface SpamSuggestionsProps {
  accountId: string
  emailId: string
  onApplied: (count: number) => void
  onClose: () => void
  open: boolean
}

type DialogState = 'loading' | 'results' | 'zero' | 'quota' | 'unavailable' | 'forbidden' | 'applying'

type ImpactState =
  { status: 'idle' } | { status: 'checking' } | { response: SpamImpactResponse; status: 'done' } | { status: 'failed' }

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

// The screen-reader summary once the check is done. An incomplete Inbox check says so first, since
// any count it gives could be short.
const impactDoneStatus = (response: SpamImpactResponse): string => {
  if (response.inboxIncomplete) return " We couldn't check all of your Inbox."
  const inboxMatching = response.phrases.filter((impact) => impact.inbox.count > 0).length
  return inboxMatching > 0
    ? ` ${inboxMatching} suggested ${plural(inboxMatching, 'phrase matches', 'phrases match')} emails in your Inbox.`
    : ' We finished checking your mail.'
}

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

// Only the daily limit gets its own message; any other 429 (throttling) reads as unavailable. A 404
// (the email or account is gone) reads as forbidden: suggestions aren't available for this email.
const errorState = (error: unknown): DialogState => {
  const httpError = error as HttpError | undefined
  return httpError?.status === 403 || httpError?.status === 404
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

// The line for a row that is not a block phrase. Block phrases show the API's answer instead.
const ImpactLine = ({ id, suggestion }: { id: string; suggestion: SpamSuggestion }): React.ReactNode =>
  suggestion.kind === 'raiseSensitivity' && suggestion.value === 'high' ? (
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
  ) : (
    <span className="mt-1.5 flex items-start gap-1.5 text-xs" id={id}>
      <Check aria-hidden="true" className="mt-px flex-shrink-0" size={12} strokeWidth={2} />
      <span>Applies to new mail only</span>
    </span>
  )

const SpamSuggestions = ({ accountId, emailId, onApplied, onClose, open }: SpamSuggestionsProps): React.ReactNode => {
  const [state, setState] = useState<DialogState>('loading')
  const [suggestions, setSuggestions] = useState<SpamSuggestion[]>([])
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set())
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const [impactState, setImpactState] = useState<ImpactState>({ status: 'idle' })
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
      setImpactState({ status: 'idle' })
      return
    }
    let current = true
    // A new email gets its own check, so an answer for the last one never shows against it.
    setImpactState({ status: 'idle' })
    postSpamSuggestions(accountId, emailId)
      .then(({ suggestions: received }) => {
        if (!current) return
        // The API validates these; anything malformed, of an unknown kind, or repeated is still dropped here.
        const valid = validSuggestions(received)
        setSuggestions(valid)
        setState(valid.length > 0 ? 'results' : 'zero')
        const phrases = valid.filter(({ kind }) => kind === 'addBlockPhrase').map(({ value }) => value)
        if (phrases.length === 0) return
        setImpactState({ status: 'checking' })
        postSpamImpact(accountId, phrases, emailId)
          .then((response: unknown) => {
            if (!current) return
            if (isSpamImpactResponse(response, phrases.length)) {
              setImpactState({ response, status: 'done' })
            } else {
              console.error('Malformed spam impact response', response)
              setImpactState({ status: 'failed' })
            }
          })
          .catch((error: unknown) => {
            if (!current) return
            console.error('Error checking suggested phrases against mail', error)
            setImpactState({ status: 'failed' })
          })
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

  // Results arrive in the order the phrases were sent, so row i of the block phrases owns result i.
  const phraseSuggestions = suggestions.filter(({ kind }) => kind === 'addBlockPhrase')
  const inboxMatches = (suggestion: SpamSuggestion): boolean =>
    impactState.status === 'done' &&
    (impactState.response.phrases[phraseSuggestions.indexOf(suggestion)]?.inbox.count ?? 0) > 0

  const pickedSuggestions = suggestions.filter((suggestion) => picked.has(suggestion.id))
  const pickedCount = pickedSuggestions.length
  const matchingPicks = pickedSuggestions.filter(inboxMatches).length
  // A pick with no complete answer (still checking, failed, or Inbox only partly read) asks for "anyway" too.
  const unsureOfPicks =
    pickedSuggestions.some(({ kind }) => kind === 'addBlockPhrase') &&
    (impactState.status !== 'done' || impactState.response.inboxIncomplete)
  const phraseImpactLine = (suggestion: SpamSuggestion, id: string): React.ReactNode => {
    if (impactState.status === 'done') {
      const impact = impactState.response.phrases[phraseSuggestions.indexOf(suggestion)]
      return (
        <PhraseImpact
          checked={impactState.response.checked}
          id={id}
          impact={impact}
          inboxIncomplete={impactState.response.inboxIncomplete}
        />
      )
    }
    return impactState.status === 'failed' ? <PhraseImpactFailed id={id} /> : <PhraseImpactPending id={id} />
  }

  const applying = state === 'applying'
  const showRows = state === 'results' || applying

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
      // Every pick was already in the rules: nothing to save, and onApplied(0) says so.
      if (changed === 0) {
        onApplied(0)
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
        : `Apply ${pickedCount} ${plural(pickedCount, 'change', 'changes')}${matchingPicks > 0 || unsureOfPicks ? ' anyway' : ''}`

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
            {impactState.status === 'checking' && ' Checking your mail…'}
            {impactState.status === 'done' && impactDoneStatus(impactState.response)}
            {impactState.status === 'failed' && " We couldn't check your mail."}
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
                  ? 'A phrase you picked matches emails in your Inbox. Those emails stay put, but new mail containing it will go to Spam, unless it comes from a trusted sender.'
                  : 'Phrases you picked match emails in your Inbox. Those emails stay put, but new mail containing them will go to Spam, unless it comes from a trusted sender.'}
              </span>
            </div>
          )}
          <ul className="flex flex-col gap-2">
            {suggestions.map((suggestion, index) => {
              const labelId = `${baseId}-${index}-label`
              const reasonId = `${baseId}-${index}-reason`
              const impactId = `${baseId}-${index}-impact`
              const checked = picked.has(suggestion.id)
              // Only the count lines describe the checkbox; the email lists stay readable in the label.
              const describedBy =
                suggestion.kind === 'addBlockPhrase' && impactState.status === 'done'
                  ? `${reasonId} ${impactSummaryIds(impactId, impactState.response.checked)}`
                  : `${reasonId} ${impactId}`
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
                      aria-describedby={describedBy}
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
                      {suggestion.kind === 'addBlockPhrase' ? (
                        phraseImpactLine(suggestion, impactId)
                      ) : (
                        <ImpactLine id={impactId} suggestion={suggestion} />
                      )}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
          {impactState.status === 'done' &&
            (impactState.response.checked.inbox.total > 0 || impactState.response.checked.spam.total > 0) && (
              <div className="mt-3">
                <ImpactFootnote
                  checked={impactState.response.checked}
                  mode="suggest"
                  phraseCount={phraseSuggestions.length}
                />
              </div>
            )}
        </>
      )}
    </ConfirmDialog>
  )
}

export default SpamSuggestions
