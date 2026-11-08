import { Check, TriangleAlert } from 'lucide-react'
import React from 'react'

import { SpamCheckedCount, SpamFolderImpact, SpamImpactResponse, SpamPhraseImpact } from '@types'

type Checked = SpamImpactResponse['checked']

export interface PhraseImpactProps {
  checked: Checked
  id: string
  // From the response. Needed for "but we couldn't check them all", which `checked` alone can't tell.
  inboxIncomplete?: boolean
  impact: SpamPhraseImpact
}

const LINE_CLASS = 'mt-1.5 flex items-start gap-1.5 text-xs'
const LINE_STYLE = { color: 'var(--text-paper)' }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isCount = (value: unknown): value is SpamCheckedCount =>
  isRecord(value) && typeof value.checked === 'number' && typeof value.total === 'number'

const isEmail = (value: unknown): boolean =>
  isRecord(value) && typeof value.from === 'string' && typeof value.id === 'string' && typeof value.subject === 'string'

const isFolderImpact = (value: unknown): value is SpamFolderImpact =>
  isRecord(value) && typeof value.count === 'number' && Array.isArray(value.emails) && value.emails.every(isEmail)

const isPhraseImpact = (value: unknown): boolean =>
  isRecord(value) && typeof value.phrase === 'string' && isFolderImpact(value.inbox) && isFolderImpact(value.spam)

// A shape guard, so a malformed response becomes a failed check instead of a thrown render.
// `phraseCount` is the number of phrases sent; the API answers one entry per phrase, in order.
export const isSpamImpactResponse = (value: unknown, phraseCount: number): value is SpamImpactResponse =>
  isRecord(value) &&
  isRecord(value.checked) &&
  isCount(value.checked.inbox) &&
  isCount(value.checked.spam) &&
  typeof value.inboxIncomplete === 'boolean' &&
  Array.isArray(value.phrases) &&
  value.phrases.length === phraseCount &&
  value.phrases.every(isPhraseImpact)

const emailNoun = (count: number): string => (count === 1 ? 'email' : 'emails')

const AlertIcon = (): React.ReactNode => (
  <TriangleAlert
    aria-hidden="true"
    className="mt-px flex-shrink-0"
    size={12}
    strokeWidth={2}
    style={{ color: 'var(--accent)' }}
  />
)

const CheckIcon = (): React.ReactNode => (
  <Check aria-hidden="true" className="mt-px flex-shrink-0" size={12} strokeWidth={2} />
)

// Spans with list roles instead of <ul>, because this renders inside a <label> in the suggestions
// modal, where a list element is invalid HTML.
const EmailList = ({ folder }: { folder: SpamFolderImpact }): React.ReactNode => (
  <span className="mt-0.5 list-disc pl-4" role="list" style={{ color: 'var(--text-paper-muted)', display: 'block' }}>
    {folder.emails.map((email) => (
      <span key={email.id} role="listitem" style={{ display: 'list-item', overflowWrap: 'anywhere' }}>
        <span>{email.subject || 'no subject'}</span>
        {email.from !== '' && <span>{` — ${email.from}`}</span>}
      </span>
    ))}
    {folder.count > folder.emails.length && (
      <span role="listitem" style={{ display: 'list-item' }}>
        and {folder.count - folder.emails.length} more
      </span>
    )}
  </span>
)

const InboxLine = ({
  checked,
  impact,
  inboxIncomplete,
}: {
  checked: SpamCheckedCount
  impact: SpamFolderImpact
  inboxIncomplete: boolean
}): React.ReactNode => {
  if (impact.count > 0) {
    return (
      <>
        <AlertIcon />
        <span className="min-w-0">
          Matches {impact.count} of {checked.checked} Inbox {emailNoun(checked.checked)}:
          <EmailList folder={impact} />
        </span>
      </>
    )
  }
  if (checked.total === 0) {
    return (
      <>
        <CheckIcon />
        <span>Your Inbox is empty, so we had nothing to check.</span>
      </>
    )
  }
  if (checked.checked === 0) {
    return (
      <>
        <AlertIcon />
        <span>We couldn&apos;t check your Inbox.</span>
      </>
    )
  }
  if (inboxIncomplete) {
    return (
      <>
        <AlertIcon />
        <span>
          No matches in {checked.checked} Inbox {emailNoun(checked.checked)}, but we couldn&apos;t check them all.
        </span>
      </>
    )
  }
  return (
    <>
      <CheckIcon />
      <span>
        No matches in {checked.checked} Inbox {emailNoun(checked.checked)}
      </span>
    </>
  )
}

const SpamLine = ({ checked, impact }: { checked: SpamCheckedCount; impact: SpamFolderImpact }): React.ReactNode => {
  if (checked.checked === 0) return null
  if (impact.count > 0) {
    return (
      <span className={LINE_CLASS} style={LINE_STYLE}>
        <CheckIcon />
        <span className="min-w-0">
          Also matches {impact.count} of {checked.checked} Spam {emailNoun(checked.checked)}:
          <EmailList folder={impact} />
        </span>
      </span>
    )
  }
  return (
    <span className={LINE_CLASS} style={LINE_STYLE}>
      <span>
        No matches in {checked.checked} Spam {emailNoun(checked.checked)}
      </span>
    </span>
  )
}

// Shows one phrase's Inbox and Spam lines from the API's answer. It does no matching.
export const PhraseImpact = ({ checked, id, impact, inboxIncomplete = false }: PhraseImpactProps): React.ReactNode => (
  <span className="block" id={id}>
    <span className={LINE_CLASS} style={LINE_STYLE}>
      <InboxLine checked={checked.inbox} impact={impact.inbox} inboxIncomplete={inboxIncomplete} />
    </span>
    <SpamLine checked={checked.spam} impact={impact.spam} />
  </span>
)

export const PhraseImpactPending = ({ id }: { id: string }): React.ReactNode => (
  <span className={LINE_CLASS} id={id} role="status" style={LINE_STYLE}>
    <span
      aria-hidden="true"
      className="mt-px inline-block h-3 w-3 flex-shrink-0 animate-spin rounded-full"
      style={{ border: '2px solid var(--paper-border)', borderTopColor: 'var(--accent)' }}
    />
    <span>Checking your mail…</span>
  </span>
)

export const PhraseImpactFailed = ({ id }: { id: string }): React.ReactNode => (
  <span className={LINE_CLASS} id={id} style={LINE_STYLE}>
    <AlertIcon />
    <span>We couldn&apos;t check this phrase against your mail.</span>
  </span>
)

export const ImpactFootnote = ({ checked }: { checked: Checked }): React.ReactNode => {
  const { inbox, spam } = checked
  if (inbox.total === 0 && spam.total === 0) return null
  const clauses = [
    ...(inbox.total > 0 ? [`${inbox.checked} of ${inbox.total} Inbox emails`] : []),
    ...(spam.total > 0 ? [`${spam.checked} of ${spam.total} Spam emails`] : []),
  ].join(' and ')
  return (
    <p className="text-xs" style={{ color: 'var(--text-paper-muted)' }}>
      {`We checked subjects and message text in ${clauses}, newest first. We didn't check attachments or older mail. Future mail with these phrases will go to Spam, unless it comes from a trusted sender.`}
    </p>
  )
}
