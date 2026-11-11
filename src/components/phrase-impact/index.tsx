import React from 'react'

import { CheckIcon, TriangleAlertIcon } from '@components/ui/icons'
import Spinner from '@components/ui/spinner'
import { SpamCheckedCount, SpamFolderImpact, SpamImpactResponse, SpamPhraseImpact } from '@types'

type Checked = SpamImpactResponse['checked']

export interface PhraseImpactProps {
  checked: Checked
  id: string
  // Required, from the response: leaving it out would hide the incomplete-check warning. Needed for "but we couldn't check the rest of your Inbox", which `checked` alone can't tell.
  inboxIncomplete: boolean
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

const AlertMark = (): React.ReactNode => (
  <TriangleAlertIcon className="mt-px flex-shrink-0" size={12} style={{ color: 'var(--accent)' }} />
)

const CheckMark = (): React.ReactNode => <CheckIcon className="mt-px flex-shrink-0" size={12} />

// Spans with list roles instead of <ul>, so these lines stay phrasing content wherever they are placed,
// including inside a <label>, where a list element is invalid HTML.
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

// Each line's text has its own id (`textId`), apart from the email list, so a control can be described by the counts
// alone. See impactSummaryIds.
const InboxLine = ({
  checked,
  impact,
  inboxIncomplete,
  textId,
}: {
  checked: SpamCheckedCount
  impact: SpamFolderImpact
  inboxIncomplete: boolean
  textId: string
}): React.ReactNode => {
  if (impact.count > 0) {
    return (
      <>
        <AlertMark />
        <span className="min-w-0">
          <span id={textId}>
            Matches {impact.count} of {checked.checked} Inbox {emailNoun(checked.checked)}:
          </span>
          <EmailList folder={impact} />
        </span>
      </>
    )
  }
  if (checked.total === 0) {
    return (
      <>
        <CheckMark />
        <span id={textId}>Your Inbox is empty, so we had nothing to check.</span>
      </>
    )
  }
  if (checked.checked === 0) {
    return (
      <>
        <AlertMark />
        <span id={textId}>We couldn&apos;t check your Inbox.</span>
      </>
    )
  }
  if (inboxIncomplete) {
    return (
      <>
        <AlertMark />
        <span id={textId}>
          No matches in {checked.checked} Inbox {emailNoun(checked.checked)}, but we couldn&apos;t check the rest of
          your Inbox.
        </span>
      </>
    )
  }
  return (
    <>
      <CheckMark />
      <span id={textId}>
        No matches in {checked.checked} Inbox {emailNoun(checked.checked)}
      </span>
    </>
  )
}

const SpamLine = ({
  checked,
  impact,
  inboxCount,
  textId,
}: {
  checked: SpamCheckedCount
  impact: SpamFolderImpact
  inboxCount: number
  textId: string
}): React.ReactNode => {
  if (checked.checked === 0) return null
  if (impact.count > 0) {
    return (
      <span className={LINE_CLASS} style={LINE_STYLE}>
        <CheckMark />
        <span className="min-w-0">
          <span id={textId}>
            {/* "Also" only follows an Inbox match. */}
            {inboxCount > 0 ? 'Also matches' : 'Matches'} {impact.count} of {checked.checked} Spam{' '}
            {emailNoun(checked.checked)}:
          </span>
          <EmailList folder={impact} />
        </span>
      </span>
    )
  }
  return (
    <span className={LINE_CLASS} style={LINE_STYLE}>
      {/* No icon here, but this keeps the text aligned with the lines that have one. */}
      <span aria-hidden="true" className="mt-px flex-shrink-0" style={{ display: 'inline-block', width: 12 }} />
      <span id={textId}>
        No matches in {checked.checked} Spam {emailNoun(checked.checked)}
      </span>
    </span>
  )
}

const inboxTextId = (id: string): string => `${id}-inbox`
const spamTextId = (id: string): string => `${id}-spam`

// The ids of PhraseImpact's count lines, without its email lists, for an aria-describedby that stays short. The
// Spam line is left out when PhraseImpact shows none.
export const impactSummaryIds = (id: string, checked: Checked): string =>
  checked.spam.checked === 0 ? inboxTextId(id) : `${inboxTextId(id)} ${spamTextId(id)}`

// Shows one phrase's Inbox and Spam lines from the API's answer. It does no matching.
export const PhraseImpact = ({ checked, id, impact, inboxIncomplete }: PhraseImpactProps): React.ReactNode => (
  <span className="block" id={id}>
    <span className={LINE_CLASS} style={LINE_STYLE}>
      <InboxLine
        checked={checked.inbox}
        impact={impact.inbox}
        inboxIncomplete={inboxIncomplete}
        textId={inboxTextId(id)}
      />
    </span>
    <SpamLine checked={checked.spam} impact={impact.spam} inboxCount={impact.inbox.count} textId={spamTextId(id)} />
  </span>
)

// No live region of its own: one per row would announce "Checking your mail…" once per phrase, and a
// region inserted with its text is often not announced at all. Callers announce through a region that
// stays mounted.
export const PhraseImpactPending = ({ id }: { id: string }): React.ReactNode => (
  <span className={LINE_CLASS} id={id} style={LINE_STYLE}>
    <span aria-hidden="true" className="mt-px inline-flex flex-shrink-0">
      <Spinner size={12} />
    </span>
    <span>Checking your mail…</span>
  </span>
)

export const PhraseImpactFailed = ({ id }: { id: string }): React.ReactNode => (
  <span className={LINE_CLASS} id={id} style={LINE_STYLE}>
    <AlertMark />
    <span>We couldn&apos;t check this phrase against your mail.</span>
  </span>
)

// Where the footnote appears: 'suggest' before anything is added, so its last sentence is conditional;
// 'save' while the owner is saving the phrases.
export type ImpactFootnoteMode = 'save' | 'suggest'

const futureMailSentence = (mode: ImpactFootnoteMode, phraseCount: number): string => {
  const several = phraseCount !== 1
  return mode === 'suggest'
    ? `If you add ${several ? 'these phrases' : 'this phrase'}, future mail with ${several ? 'them' : 'it'} will go to Spam, unless it comes from a trusted sender.`
    : `Future mail with ${several ? 'these phrases' : 'this phrase'} will go to Spam, unless it comes from a trusted sender.`
}

// `phraseCount` is the number of phrases checked, for "this phrase" or "these phrases".
export const ImpactFootnote = ({
  checked,
  mode,
  phraseCount,
}: {
  checked: Checked
  mode: ImpactFootnoteMode
  phraseCount: number
}): React.ReactNode => {
  const { inbox, spam } = checked
  if (inbox.total === 0 && spam.total === 0) return null
  const clauses = [
    ...(inbox.total > 0 ? [`${inbox.checked} of ${inbox.total} Inbox ${emailNoun(inbox.total)}`] : []),
    ...(spam.total > 0 ? [`${spam.checked} of ${spam.total} Spam ${emailNoun(spam.total)}`] : []),
  ].join(' and ')
  return (
    <p className="text-xs" style={{ color: 'var(--text-paper-muted)' }}>
      {`We checked subjects and message text in ${clauses}, newest first. We didn't check attachments or older mail. ${futureMailSentence(mode, phraseCount)}`}
    </p>
  )
}
