import React, { useEffect, useId, useState } from 'react'

import {
  ImpactFootnote,
  impactSummaryIds,
  isSpamImpactResponse,
  PhraseImpact,
  PhraseImpactFailed,
  PhraseImpactPending,
} from '@components/phrase-impact'
import { movedEmailName, subjectName } from '@components/spam-notice'
import Button from '@components/ui/button'
import Checkbox from '@components/ui/checkbox'
import Dialog from '@components/ui/dialog'
import { CheckIcon, TriangleAlertIcon } from '@components/ui/icons'
import SectionHeading from '@components/ui/section-heading'
import Spinner from '@components/ui/spinner'
import { getAccount, postSpamImpact, postSpamSuggestions, putAccount } from '@services/emails'
import { applySuggestions, SPAM_FILTER_LIST_LIMIT, wouldExceedLimits } from '@services/spam-impact'
import {
  DEFAULT_SPAM_FILTER,
  HttpError,
  SpamFilter,
  SpamImpactResponse,
  SpamSuggestion,
  SpamSuggestionKind,
  SpamSuggestionLevel,
} from '@types'

export interface SpamSuggestionsProps {
  accountId: string
  // The moved email's From line and subject, so the dialog names the email it reads: the viewer
  // already shows the next one.
  emailFrom: string
  emailId: string
  emailSubject: string
  onApplied: (count: number) => void
  onClose: () => void
  open: boolean
}

type DialogState = 'loading' | 'results' | 'zero' | 'quota' | 'unavailable' | 'forbidden' | 'applying'

type ImpactState =
  { status: 'idle' } | { status: 'checking' } | { response: SpamImpactResponse; status: 'done' } | { status: 'failed' }

const KINDS: ReadonlySet<SpamSuggestionKind> = new Set(['addBlockPhrase', 'removeTrustedSender', 'raiseSensitivity'])

// The groups, from the changes least likely to catch wanted mail to the most.
const LEVELS: readonly { help: string; level: SpamSuggestionLevel; title: string }[] = [
  { help: 'Closest to the email you moved. These rarely catch mail you want.', level: 'targeted', title: 'Targeted' },
  {
    help: 'These catch more mail like that one. They may catch some mail you want.',
    level: 'broader',
    title: 'Broader',
  },
  {
    help: "These catch the most. They're the likeliest to catch mail you want, so we didn't pick them for you.",
    level: 'aggressive',
    title: 'Aggressive',
  },
]
const LEVEL_NAMES: ReadonlySet<unknown> = new Set(LEVELS.map(({ level }) => level))

// Aggressive suggestions start unticked; the rest start ticked.
const pickedByDefault = ({ level }: SpamSuggestion): boolean => level !== 'aggressive'

interface Selection {
  // The rows we picked for the person, less any we unticked once the check found them in the Inbox.
  defaults: ReadonlySet<string>
  picked: ReadonlySet<string>
  // Whether the person has ticked or unticked a row. Once they have, the check leaves their picks alone.
  touched: boolean
}

const startSelection = (ids: string[]): Selection => ({ defaults: new Set(ids), picked: new Set(ids), touched: false })

const without = (ids: ReadonlySet<string>, removed: ReadonlySet<string>): ReadonlySet<string> =>
  new Set([...ids].filter((id) => !removed.has(id)))

// Unticks our picks whose phrase matches Inbox mail, unless the person has already changed the picks.
const untickInboxMatches = (selection: Selection, matching: ReadonlySet<string>): Selection =>
  selection.touched
    ? selection
    : { ...selection, defaults: without(selection.defaults, matching), picked: without(selection.picked, matching) }

// `name` is the moved email's subject in quotes, or "the email with no subject".
const stateMessages = (
  name: React.ReactNode,
): Readonly<Partial<Record<DialogState, { detail: string; lead: React.ReactNode }>>> => ({
  forbidden: {
    detail: "It's still in Spam, and you can change your spam filter anytime in Settings.",
    lead: <>Rule suggestions aren&apos;t available for {name}.</>,
  },
  quota: {
    detail: 'Try again tomorrow. That email is still in Spam, and you can change your spam filter anytime in Settings.',
    lead: "You've reached today's limit for rule suggestions.",
  },
  unavailable: {
    detail: 'Try again later. That email is still in Spam, and you can change your spam filter anytime in Settings.',
    lead: "Rule suggestions aren't available right now.",
  },
  zero: {
    detail: "It's still in Spam. To catch more mail like it, add a block phrase under Spam filter in Settings.",
    lead: <>We don&apos;t have any suggestions for {name}.</>,
  },
})

// Why a footer button can't act yet, shown when it is pressed.
const NOTHING_PICKED = 'Pick at least one change to apply.'
const WAIT_FOR_APPLY = 'Wait until we finish applying your changes.'

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

// The level the API gives a suggestion of each kind, for a response from before levels: a sensitivity
// change is broader, or aggressive for High; anything else is targeted.
const legacyLevel = ({ kind, value }: Pick<SpamSuggestion, 'kind' | 'value'>): SpamSuggestionLevel =>
  kind === 'raiseSensitivity' ? (value === 'high' ? 'aggressive' : 'broader') : 'targeted'

// A missing level passes: an API from before levels sends none, and legacyLevel fills it in.
const isSuggestion = (value: unknown): value is Omit<SpamSuggestion, 'level'> & { level?: SpamSuggestionLevel } => {
  const candidate = value as Partial<Record<keyof SpamSuggestion, unknown>> | null | undefined
  return (
    typeof candidate?.id === 'string' &&
    typeof candidate.kind === 'string' &&
    typeof candidate.value === 'string' &&
    typeof candidate.reason === 'string' &&
    KINDS.has(candidate.kind as SpamSuggestionKind) &&
    (candidate.level === undefined || LEVEL_NAMES.has(candidate.level))
  )
}

// Well-formed suggestions of a known kind and level, first of each id only. `fromBeforeLevels` is true when none
// of them has a level: their levels are only our guess, so we pick none of them for the person.
const validSuggestions = (received: unknown): { fromBeforeLevels: boolean; valid: SpamSuggestion[] } => {
  const wellFormed = (Array.isArray(received) ? received : [])
    .filter(isSuggestion)
    .filter((suggestion, index, all) => all.findIndex(({ id }) => id === suggestion.id) === index)
  return {
    fromBeforeLevels: wellFormed.every(({ level }) => level === undefined),
    valid: wellFormed.map((suggestion) => ({ ...suggestion, level: suggestion.level ?? legacyLevel(suggestion) })),
  }
}

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
      <TriangleAlertIcon className="mt-px flex-shrink-0" size={12} style={{ color: 'var(--accent)' }} />
      <span>Applies to new mail only. High may catch real mail.</span>
    </span>
  ) : (
    <span className="mt-1.5 flex items-start gap-1.5 text-xs" id={id}>
      <CheckIcon className="mt-px flex-shrink-0" size={12} />
      <span>Applies to new mail only</span>
    </span>
  )

const SpamSuggestions = ({
  accountId,
  emailFrom,
  emailId,
  emailSubject,
  onApplied,
  onClose,
  open,
}: SpamSuggestionsProps): React.ReactNode => {
  const [state, setState] = useState<DialogState>('loading')
  const [suggestions, setSuggestions] = useState<SpamSuggestion[]>([])
  const [selection, setSelection] = useState<Selection>(() => startSelection([]))
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const [impactState, setImpactState] = useState<ImpactState>({ status: 'idle' })
  const baseId = useId()

  useEffect(() => {
    if (!open) {
      // Reset while closed, so the next opening starts at loading and the dialog's initial focus
      // never lands on a row from last time.
      setState('loading')
      setSuggestions([])
      setSelection(startSelection([]))
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
        const { fromBeforeLevels, valid } = validSuggestions(received)
        setSuggestions(valid)
        setSelection(startSelection(fromBeforeLevels ? [] : valid.filter(pickedByDefault).map(({ id }) => id)))
        setState(valid.length > 0 ? 'results' : 'zero')
        const phraseRows = valid.filter(({ kind }) => kind === 'addBlockPhrase')
        const phrases = phraseRows.map(({ value }) => value)
        if (phrases.length === 0) return
        setImpactState({ status: 'checking' })
        postSpamImpact(accountId, phrases, emailId)
          .then((response: unknown) => {
            if (!current) return
            if (isSpamImpactResponse(response, phrases.length)) {
              setImpactState({ response, status: 'done' })
              const matching = new Set(
                phraseRows.filter((_, index) => response.phrases[index].inbox.count > 0).map(({ id }) => id),
              )
              setSelection((previous) => untickInboxMatches(previous, matching))
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

  const pickedSuggestions = suggestions.filter((suggestion) => selection.picked.has(suggestion.id))
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

  const defaultPickCount = selection.defaults.size

  const applying = state === 'applying'
  const showRows = state === 'results' || applying

  const togglePick = (id: string): void => {
    if (applying) return
    setSelection((previous) => ({
      ...previous,
      picked: previous.picked.has(id) ? without(previous.picked, new Set([id])) : new Set([...previous.picked, id]),
      touched: true,
    }))
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
      : `Apply ${pickedCount} ${plural(pickedCount, 'change', 'changes')}${matchingPicks > 0 || unsureOfPicks ? ' anyway' : ''}`

  // One first button for every state, so the element that holds focus while loading is the same
  // one after the results (Cancel) or a message (Close) arrive.
  const closesOnly = !showRows && state !== 'loading'
  const footer = (
    <div className="flex flex-shrink-0 justify-end gap-2">
      <Button
        className="rounded-md px-4 py-2 text-sm font-medium transition-all"
        onClick={handleClose}
        style={{ fontFamily: 'Outfit, sans-serif' }}
        unavailableReason={applying ? WAIT_FOR_APPLY : undefined}
        variant={closesOnly ? 'primary' : 'secondary'}
      >
        {closesOnly ? 'Close' : 'Cancel'}
      </Button>
      {showRows && (
        <Button
          busy={applying}
          busyLabel="Applying…"
          className="rounded-md px-4 py-2 text-sm font-medium transition-all"
          onClick={handleApply}
          style={{ fontFamily: 'Outfit, sans-serif' }}
          unavailableReason={pickedCount === 0 ? NOTHING_PICKED : undefined}
          variant="primary"
        >
          {primaryLabel}
        </Button>
      )}
    </div>
  )

  const emailName = subjectName(emailSubject)
  const message = stateMessages(emailName)[state]

  return (
    <Dialog footer={footer} onCancel={handleClose} open={open} scrollable title="Suggested rule changes">
      {/* Mounted for every state, so each change of state is announced. */}
      <div role="status">
        {state === 'loading' && (
          <div className="flex flex-col items-center gap-3.5 pb-2 pt-5 text-center">
            <Spinner size={24} />
            <p style={{ color: 'var(--text-paper)', overflowWrap: 'anywhere' }}>Reading {emailName}</p>
          </div>
        )}
        {message && (
          <>
            <p style={{ color: 'var(--text-paper)', overflowWrap: 'anywhere' }}>{message.lead}</p>
            <p className="mt-2">{message.detail}</p>
          </>
        )}
        {showRows && (
          <span className="sr-only">
            {suggestions.length} suggested {plural(suggestions.length, 'change', 'changes')},{' '}
            {defaultPickCount === 0 ? 'none' : defaultPickCount} picked for you.
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
            <TriangleAlertIcon className="mt-0.5 flex-shrink-0" size={14} style={{ color: 'var(--accent)' }} />
            <span style={{ overflowWrap: 'anywhere' }}>{errorMessage}</span>
          </p>
        )}
      </div>
      {showRows && (
        <>
          <p className="mb-1 text-xs" style={{ color: 'var(--text-paper-muted)', overflowWrap: 'anywhere' }}>
            Based on {movedEmailName(emailSubject, emailFrom)}.
          </p>
          <p className="mb-3">
            {defaultPickCount === 0
              ? 'Pick the changes you want. We save nothing until you apply them.'
              : 'We picked the safer changes for you. You can change them. We save nothing until you apply them.'}
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
              <TriangleAlertIcon className="mt-0.5 flex-shrink-0" size={14} style={{ color: 'var(--accent)' }} />
              <span>
                {matchingPicks === 1
                  ? 'A picked phrase matches emails in your Inbox. Those emails stay put, but new mail containing it will go to Spam, unless it comes from a trusted sender.'
                  : 'Picked phrases match emails in your Inbox. Those emails stay put, but new mail containing them will go to Spam, unless it comes from a trusted sender.'}
              </span>
            </div>
          )}
          <div className="flex flex-col gap-4">
            {LEVELS.map(({ help, level, title }) => {
              // Rows keep their index in the response, which keeps their ids unique across groups.
              const rows = suggestions
                .map((suggestion, index) => ({ index, suggestion }))
                .filter(({ suggestion }) => suggestion.level === level)
              if (rows.length === 0) return null
              const headingId = `${baseId}-${level}-heading`
              return (
                <section key={level}>
                  <SectionHeading as="h3" id={headingId} tone="strong">
                    {title}
                  </SectionHeading>
                  <p className="mb-2 mt-0.5 text-xs" style={{ color: 'var(--text-paper-muted)' }}>
                    {help}
                  </p>
                  <ul aria-labelledby={headingId} className="flex flex-col gap-2">
                    {rows.map(({ index, suggestion }) => {
                      const reasonId = `${baseId}-${index}-reason`
                      const impactId = `${baseId}-${index}-impact`
                      const checked = selection.picked.has(suggestion.id)
                      // Only the count lines describe the checkbox; the email lists stay readable in the label.
                      const describedBy =
                        suggestion.kind === 'addBlockPhrase' && impactState.status === 'done'
                          ? `${reasonId} ${impactSummaryIds(impactId, impactState.response.checked)}`
                          : `${reasonId} ${impactId}`
                      return (
                        <li key={suggestion.id}>
                          {/* The card around the Checkbox. Its padding is the Checkbox's, so a click anywhere in
                              the card toggles the pick. accent-color is inherited, so the tick stays violet. */}
                          <div
                            className="rounded-[10px]"
                            style={{
                              accentColor: 'var(--accent-deep)',
                              background: checked
                                ? 'linear-gradient(0deg, var(--accent-subtle), var(--accent-subtle)), var(--paper-surface)'
                                : 'var(--paper-surface)',
                              border: `1px solid ${checked ? 'var(--accent-border)' : 'var(--paper-border)'}`,
                            }}
                          >
                            {/* Named by the change alone. The reason and impact lines are the Checkbox's
                                details: in the same clickable row, out of the name, and described through
                                describedBy (the counts only, so the email lists stay readable but unread). */}
                            <Checkbox
                              checked={checked}
                              className="px-3 py-2.5"
                              describedBy={describedBy}
                              details={
                                <span className="block" style={{ color: 'var(--text-paper-muted)' }}>
                                  <span className="mt-0.5 block text-xs" id={reasonId}>
                                    {suggestion.reason}
                                  </span>
                                  {suggestion.kind === 'addBlockPhrase' ? (
                                    phraseImpactLine(suggestion, impactId)
                                  ) : (
                                    <ImpactLine id={impactId} suggestion={suggestion} />
                                  )}
                                </span>
                              }
                              label={
                                <span className="block text-sm font-medium" style={{ overflowWrap: 'anywhere' }}>
                                  {changeLabel(suggestion)}
                                </span>
                              }
                              onChange={() => togglePick(suggestion.id)}
                              readOnly={applying}
                            />
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )
            })}
          </div>
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
    </Dialog>
  )
}

export default SpamSuggestions
