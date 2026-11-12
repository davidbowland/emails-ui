import React from 'react'

import { ImpactFootnote, PhraseImpact, PhraseImpactFailed, PhraseImpactPending } from '@components/phrase-impact'
import Button from '@components/ui/button'
import Dialog from '@components/ui/dialog'
import { SpamFilter, SpamImpactResponse } from '@types'

// New block phrases waiting on the owner's answer, with the filter to save. 'checkFailed' is a check
// that errored or came back malformed; the owner may still save.
export interface ImpactCheck {
  phrases: string[]
  result: SpamImpactResponse | 'checkFailed'
  spamFilter: SpamFilter
}

const hasMatch = (check: ImpactCheck, folder: 'inbox' | 'spam'): boolean =>
  check.result !== 'checkFailed' && check.result.phrases.some((impact) => impact[folder].count > 0)

// How many of the new phrases match at least one email in the folder.
const countMatching = (check: ImpactCheck, folder: 'inbox' | 'spam'): number =>
  check.result === 'checkFailed' ? 0 : check.result.phrases.filter((impact) => impact[folder].count > 0).length

// Whether the owner needs to see the result before the phrases save.
export const needsReview = (check: ImpactCheck): boolean =>
  check.result === 'checkFailed' || check.result.inboxIncomplete || hasMatch(check, 'inbox') || hasMatch(check, 'spam')

// The dialog's description, so a screen reader reads the lead when focus lands on Keep editing.
const IMPACT_LEAD_ID = 'settings-impact-lead'

const checkingLead = (phrases: string[]): string =>
  phrases.length > 1
    ? 'Before your new phrases take effect, we check them against the mail you already have.'
    : 'Before your new phrase takes effect, we check it against the mail you already have.'

// Tried in order; the first row that applies sets the lead.
const impactLead = (check: ImpactCheck): string => {
  const several = check.phrases.length > 1
  if (hasMatch(check, 'inbox')) {
    // Plural only when more than one of the phrases is the one matching the Inbox.
    return countMatching(check, 'inbox') > 1
      ? 'These new phrases match emails already in your Inbox. Those emails stay put, but new mail containing them will go to Spam, unless it comes from a trusted sender.'
      : 'This new phrase matches emails already in your Inbox. Those emails stay put, but new mail containing it will go to Spam, unless it comes from a trusted sender.'
  }
  if (check.result === 'checkFailed') {
    return several
      ? "We couldn't check your new phrases against your mail. You can save them anyway."
      : "We couldn't check your new phrase against your mail. You can save it anyway."
  }
  if (check.result.inboxIncomplete) {
    return several
      ? "We couldn't check all of your Inbox. Your new phrases may match emails we didn't check."
      : "We couldn't check all of your Inbox. Your new phrase may match emails we didn't check."
  }
  // Plural only when more than one of the phrases is the one matching Spam.
  return countMatching(check, 'spam') > 1
    ? "Here's the mail in Spam that your new phrases match."
    : "Here's the mail in Spam that your new phrase matches."
}

// Matches in Spam alone are information, not a warning, so the button does not say "anyway".
const impactConfirmLabel = (check: ImpactCheck): string =>
  check.result !== 'checkFailed' && !check.result.inboxIncomplete && !hasMatch(check, 'inbox') ? 'Save' : 'Save anyway'

const PHRASE_ROW_STYLE: React.CSSProperties = {
  background: 'var(--paper-surface)',
  border: '1px solid var(--paper-border)',
  borderRadius: '10px',
  padding: '10px 12px',
}

const ImpactDialogBody = ({
  check,
  leadId,
  phrases,
}: {
  check: ImpactCheck | 'checking'
  leadId: string
  phrases: string[]
}): React.ReactNode => {
  const result = check === 'checking' ? 'checking' : check.result
  return (
    <>
      <p id={leadId}>{check === 'checking' ? checkingLead(phrases) : impactLead(check)}</p>
      <ul className="mt-3 flex flex-col gap-2.5" style={{ listStyle: 'none', padding: 0 }}>
        {phrases.map((phrase, index) => (
          <li key={`${index}-${phrase}`} style={PHRASE_ROW_STYLE}>
            <span className="block" style={{ color: 'var(--text-paper)', overflowWrap: 'anywhere' }}>
              {`“${phrase}”`}
            </span>
            {result === 'checking' ? (
              <PhraseImpactPending id={`settings-impact-${index}`} />
            ) : result === 'checkFailed' ? (
              <PhraseImpactFailed id={`settings-impact-${index}`} />
            ) : (
              <PhraseImpact
                checked={result.checked}
                id={`settings-impact-${index}`}
                impact={result.phrases[index]}
                inboxIncomplete={result.inboxIncomplete}
              />
            )}
          </li>
        ))}
      </ul>
      {result !== 'checking' && result !== 'checkFailed' && (
        <div className="mt-3">
          <ImpactFootnote checked={result.checked} mode="save" phraseCount={phrases.length} />
        </div>
      )}
    </>
  )
}

const FOOTER_BUTTON_CLASS = 'rounded-md px-4 py-2 text-sm font-medium transition-all'
const FOOTER_BUTTON_STYLE: React.CSSProperties = { fontFamily: 'Outfit, sans-serif' }

export interface ImpactDialogProps {
  check: ImpactCheck | 'checking'
  onConfirm: () => void
  onKeepEditing: () => void
  open: boolean
  phrases: string[]
  returnFocusTo: () => HTMLElement | null
}

// Opens while the check runs, so the owner sees what Save is waiting on. The footer is the same two
// buttons in every state, so focus stays on Keep editing when the result arrives.
export const ImpactDialog = ({
  check,
  onConfirm,
  onKeepEditing,
  open,
  phrases,
  returnFocusTo,
}: ImpactDialogProps): React.ReactNode => (
  <Dialog
    describedBy={IMPACT_LEAD_ID}
    footer={
      <div className="flex justify-end gap-2">
        <Button className={FOOTER_BUTTON_CLASS} onClick={onKeepEditing} style={FOOTER_BUTTON_STYLE} variant="secondary">
          Keep editing
        </Button>
        <Button
          busy={check === 'checking'}
          busyLabel="Checking your mail…"
          className={FOOTER_BUTTON_CLASS}
          onClick={onConfirm}
          style={FOOTER_BUTTON_STYLE}
          variant="primary"
        >
          {check === 'checking' ? 'Save anyway' : impactConfirmLabel(check)}
        </Button>
      </div>
    }
    onCancel={onKeepEditing}
    open={open}
    returnFocusTo={returnFocusTo}
    scrollable
    title="Check your new block phrases"
  >
    {open && <ImpactDialogBody check={check} leadId={IMPACT_LEAD_ID} phrases={phrases} />}
  </Dialog>
)
