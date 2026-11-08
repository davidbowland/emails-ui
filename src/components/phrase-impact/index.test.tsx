import React from 'react'

import {
  ImpactFootnote,
  impactSummaryIds,
  isSpamImpactResponse,
  PhraseImpact,
  PhraseImpactFailed,
  PhraseImpactPending,
} from './index'
import { spamImpactIncomplete, spamImpactResponse } from '@test/__mocks__'
import '@testing-library/jest-dom'
import { render, screen, within } from '@testing-library/react'
import { SpamCheckedCount, SpamFolderImpact, SpamImpactEmail, SpamImpactResponse, SpamPhraseImpact } from '@types'

const [matching, clean] = spamImpactResponse.phrases
const { checked } = spamImpactResponse

const folder = (count: number, emails: SpamImpactEmail[] = []): SpamFolderImpact => ({ count, emails })
const counts = (inbox: SpamCheckedCount, spam: SpamCheckedCount): SpamImpactResponse['checked'] => ({ inbox, spam })
const withInbox = (inbox: SpamFolderImpact): SpamPhraseImpact => ({ ...clean, inbox })

describe('PhraseImpact', () => {
  it('shows the Inbox and Spam match lines', () => {
    render(<PhraseImpact checked={checked} id="impact" impact={matching} inboxIncomplete={false} />)

    expect(screen.getByText(/Matches 2 of 100 Inbox emails:/)).toBeInTheDocument()
    expect(screen.getByText(/Also matches 3 of 25 Spam emails:/)).toBeInTheDocument()
  })

  it('lists the subject and sender of each matching email', () => {
    render(<PhraseImpact checked={checked} id="impact" impact={matching} inboxIncomplete={false} />)

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(5)
    expect(items[0]).toHaveTextContent('Lunch on Friday')
    expect(items[0]).toHaveTextContent('friend@domain.com')
    expect(items[1]).toHaveTextContent('Your receipt')
  })

  it('shows "no subject" for an empty subject and leaves out an empty sender', () => {
    const impact = withInbox(folder(1, [{ from: '', id: 'a', subject: '' }]))
    render(<PhraseImpact checked={checked} id="impact" impact={impact} inboxIncomplete={false} />)

    const item = screen.getByRole('listitem')
    expect(item).toHaveTextContent(/^no subject$/)
  })

  it('shows how many matches are not listed', () => {
    const emails = [1, 2, 3, 4, 5].map((n) => ({ from: 'a@b.com', id: `e${n}`, subject: `Subject ${n}` }))
    render(<PhraseImpact checked={checked} id="impact" impact={withInbox(folder(9, emails))} inboxIncomplete={false} />)

    expect(screen.getAllByRole('listitem')).toHaveLength(6)
    expect(screen.getByText('and 4 more')).toBeInTheDocument()
  })

  it('does not show "and N more" when every match is listed', () => {
    render(<PhraseImpact checked={checked} id="impact" impact={matching} inboxIncomplete={false} />)

    expect(screen.queryByText(/and \d+ more/)).not.toBeInTheDocument()
  })

  it('shows no matches for a clean phrase', () => {
    render(<PhraseImpact checked={checked} id="impact" impact={clean} inboxIncomplete={false} />)

    expect(screen.getByText('No matches in 100 Inbox emails')).toBeInTheDocument()
    expect(screen.getByText('No matches in 25 Spam emails')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('says so when the Inbox is empty', () => {
    const empty = counts({ checked: 0, total: 0 }, checked.spam)
    render(<PhraseImpact checked={empty} id="impact" impact={clean} inboxIncomplete={false} />)

    expect(screen.getByText('Your Inbox is empty, so we had nothing to check.')).toBeInTheDocument()
  })

  it('says so when no Inbox email could be checked', () => {
    const unread = counts({ checked: 0, total: 40 }, checked.spam)
    render(<PhraseImpact checked={unread} id="impact" impact={clean} inboxIncomplete={false} />)

    expect(screen.getByText("We couldn't check your Inbox.")).toBeInTheDocument()
  })

  it('says so when the Inbox check was incomplete and found no match', () => {
    const [phrase] = spamImpactIncomplete.phrases
    render(<PhraseImpact checked={spamImpactIncomplete.checked} id="impact" impact={phrase} inboxIncomplete />)

    expect(
      screen.getByText("No matches in 62 Inbox emails, but we couldn't check the rest of your Inbox."),
    ).toBeInTheDocument()
  })

  it('shows Inbox matches even when the check was incomplete', () => {
    render(<PhraseImpact checked={checked} id="impact" impact={matching} inboxIncomplete />)

    expect(screen.getByText(/Matches 2 of 100 Inbox emails:/)).toBeInTheDocument()
    expect(screen.queryByText(/couldn't check the rest of your Inbox/)).not.toBeInTheDocument()
  })

  it('shows no Spam line when no Spam email was checked', () => {
    const noSpam = counts(checked.inbox, { checked: 0, total: 0 })
    render(<PhraseImpact checked={noSpam} id="impact" impact={clean} inboxIncomplete={false} />)

    expect(screen.getByText('No matches in 100 Inbox emails')).toBeInTheDocument()
    expect(screen.queryByText(/Spam/)).not.toBeInTheDocument()
  })

  it('drops "Also" from the Spam line when nothing in the Inbox matches', () => {
    render(
      <PhraseImpact checked={checked} id="impact" impact={{ ...matching, inbox: folder(0) }} inboxIncomplete={false} />,
    )

    expect(screen.getByText(/^Matches 3 of 25 Spam emails:/)).toBeInTheDocument()
    expect(screen.queryByText(/Also matches/)).not.toBeInTheDocument()
  })

  it('uses the singular for one Inbox email checked when the check was incomplete', () => {
    const one = counts({ checked: 1, total: 40 }, checked.spam)
    render(<PhraseImpact checked={one} id="impact" impact={clean} inboxIncomplete />)

    expect(
      screen.getByText("No matches in 1 Inbox email, but we couldn't check the rest of your Inbox."),
    ).toBeInTheDocument()
  })

  it('uses the singular for one Spam email checked', () => {
    const one = counts(checked.inbox, { checked: 1, total: 1 })
    render(<PhraseImpact checked={one} id="impact" impact={clean} inboxIncomplete={false} />)

    expect(screen.getByText('No matches in 1 Spam email')).toBeInTheDocument()
  })

  it('uses the singular for one matching Spam email', () => {
    const one = counts(checked.inbox, { checked: 1, total: 1 })
    render(<PhraseImpact checked={one} id="impact" impact={matching} inboxIncomplete={false} />)

    expect(screen.getByText(/Also matches 3 of 1 Spam email:/)).toBeInTheDocument()
  })

  it('uses the singular for one email checked', () => {
    const one = counts({ checked: 1, total: 1 }, checked.spam)
    render(<PhraseImpact checked={one} id="impact" impact={clean} inboxIncomplete={false} />)

    expect(screen.getByText('No matches in 1 Inbox email')).toBeInTheDocument()
  })

  it('renders lists as spans with list roles, safe inside a label', () => {
    const { container } = render(
      <label>
        <PhraseImpact checked={checked} id="impact" impact={matching} inboxIncomplete={false} />
      </label>,
    )

    expect(screen.getAllByRole('list')).toHaveLength(2)
    expect(container.querySelector('ul, li')).toBeNull()
  })

  it('hides decorative icons from assistive technology', () => {
    const { container } = render(
      <PhraseImpact checked={checked} id="impact" impact={matching} inboxIncomplete={false} />,
    )

    const icons = container.querySelectorAll('svg')
    expect(icons.length).toBeGreaterThan(0)
    icons.forEach((icon) => expect(icon).toHaveAttribute('aria-hidden', 'true'))
  })

  it('sets the id on the region for aria-describedby', () => {
    const { container } = render(
      <PhraseImpact checked={checked} id="impact" impact={matching} inboxIncomplete={false} />,
    )

    expect(container.querySelector('#impact')).toBeInTheDocument()
    expect(within(container.querySelector('#impact') as HTMLElement).getAllByRole('listitem')).toHaveLength(5)
  })

  it('renders a hostile subject as text', () => {
    const impact = withInbox(folder(1, [{ from: 'a@b.com', id: 'x', subject: '<img src=x onerror=alert(1)>' }]))
    render(<PhraseImpact checked={checked} id="impact" impact={impact} inboxIncomplete={false} />)

    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
  })
})

describe('impactSummaryIds', () => {
  it('names the count lines, which hold no email list', () => {
    const { container } = render(
      <PhraseImpact checked={checked} id="impact" impact={matching} inboxIncomplete={false} />,
    )
    const ids = impactSummaryIds('impact', checked).split(' ')

    expect(ids).toEqual(['impact-inbox', 'impact-spam'])
    expect(container.querySelector('#impact-inbox')).toHaveTextContent(/^Matches 2 of 100 Inbox emails:$/)
    expect(container.querySelector('#impact-spam')).toHaveTextContent(/^Also matches 3 of 25 Spam emails:$/)
  })

  it('leaves out the Spam line when no Spam email was checked', () => {
    const noSpam = counts(checked.inbox, { checked: 0, total: 0 })
    const { container } = render(<PhraseImpact checked={noSpam} id="impact" impact={clean} inboxIncomplete={false} />)

    expect(impactSummaryIds('impact', noSpam)).toEqual('impact-inbox')
    expect(container.querySelector('#impact-inbox')).toHaveTextContent('No matches in 100 Inbox emails')
    expect(container.querySelector('#impact-spam')).not.toBeInTheDocument()
  })
})

describe('PhraseImpactPending', () => {
  it('shows that the check is running', () => {
    const { container } = render(<PhraseImpactPending id="pending" />)

    expect(screen.getByText('Checking your mail…')).toBeInTheDocument()
    expect(container.querySelector('#pending')).toBeInTheDocument()
    expect(container.querySelector('#pending > span')).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('PhraseImpactFailed', () => {
  it('shows that the check failed', () => {
    const { container } = render(<PhraseImpactFailed id="failed" />)

    expect(screen.getByText("We couldn't check this phrase against your mail.")).toBeInTheDocument()
    expect(container.querySelector('#failed')).toBeInTheDocument()
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('ImpactFootnote', () => {
  it('shows the full sentence when saving', () => {
    render(<ImpactFootnote checked={checked} mode="save" phraseCount={2} />)

    expect(
      screen.getByText(
        "We checked subjects and message text in 100 of 150 Inbox emails and 25 of 40 Spam emails, newest first. We didn't check attachments or older mail. Future mail with these phrases will go to Spam, unless it comes from a trusted sender.",
      ),
    ).toBeInTheDocument()
  })

  it('says "this phrase" when saving one phrase', () => {
    render(<ImpactFootnote checked={checked} mode="save" phraseCount={1} />)

    expect(
      screen.getByText(/Future mail with this phrase will go to Spam, unless it comes from a trusted sender\.$/),
    ).toBeInTheDocument()
    expect(screen.queryByText(/these phrases/)).not.toBeInTheDocument()
  })

  it('says what adding several suggested phrases would do', () => {
    render(<ImpactFootnote checked={checked} mode="suggest" phraseCount={2} />)

    expect(
      screen.getByText(
        "We checked subjects and message text in 100 of 150 Inbox emails and 25 of 40 Spam emails, newest first. We didn't check attachments or older mail. If you add these phrases, future mail with them will go to Spam, unless it comes from a trusted sender.",
      ),
    ).toBeInTheDocument()
  })

  it('says what adding one suggested phrase would do', () => {
    render(<ImpactFootnote checked={checked} mode="suggest" phraseCount={1} />)

    expect(
      screen.getByText(
        /older mail\. If you add this phrase, future mail with it will go to Spam, unless it comes from a trusted sender\.$/,
      ),
    ).toBeInTheDocument()
  })

  it('uses the singular for one email in a folder', () => {
    render(
      <ImpactFootnote
        checked={counts({ checked: 1, total: 1 }, { checked: 1, total: 1 })}
        mode="save"
        phraseCount={2}
      />,
    )

    expect(screen.getByText(/in 1 of 1 Inbox email and 1 of 1 Spam email, newest first\./)).toBeInTheDocument()
  })

  it('drops the Spam clause when there are no Spam emails', () => {
    render(<ImpactFootnote checked={counts(checked.inbox, { checked: 0, total: 0 })} mode="save" phraseCount={2} />)

    expect(
      screen.getByText(/^We checked subjects and message text in 100 of 150 Inbox emails, newest first\./),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Spam emails/)).not.toBeInTheDocument()
  })

  it('drops the Inbox clause when there are no Inbox emails', () => {
    render(<ImpactFootnote checked={counts({ checked: 0, total: 0 }, checked.spam)} mode="save" phraseCount={2} />)

    expect(
      screen.getByText(/^We checked subjects and message text in 25 of 40 Spam emails, newest first\./),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Inbox emails/)).not.toBeInTheDocument()
  })

  it('renders nothing when both folders are empty', () => {
    const { container } = render(
      <ImpactFootnote
        checked={counts({ checked: 0, total: 0 }, { checked: 0, total: 0 })}
        mode="save"
        phraseCount={2}
      />,
    )

    expect(container).toBeEmptyDOMElement()
  })
})

describe('isSpamImpactResponse', () => {
  const clone = (): Record<string, unknown> => JSON.parse(JSON.stringify(spamImpactResponse))
  const withFirstPhrase = (change: (phrase: Record<string, unknown>) => void): unknown => {
    const value = clone()
    change((value.phrases as Record<string, unknown>[])[0])
    return value
  }

  it('accepts the fixtures', () => {
    expect(isSpamImpactResponse(spamImpactResponse, 2)).toBe(true)
    expect(isSpamImpactResponse(spamImpactIncomplete, 1)).toBe(true)
  })

  it('rejects a phrase count that differs from the request', () => {
    expect(isSpamImpactResponse(spamImpactResponse, 1)).toBe(false)
    expect(isSpamImpactResponse(spamImpactResponse, 3)).toBe(false)
  })

  it.each([null, undefined, 'text', 4, []])('rejects %p', (value) => {
    expect(isSpamImpactResponse(value, 2)).toBe(false)
  })

  it('rejects a missing checked', () => {
    expect(isSpamImpactResponse({ ...clone(), checked: undefined }, 2)).toBe(false)
  })

  it('rejects a checked count that is not a number', () => {
    const value = clone()
    ;(value.checked as { inbox: Record<string, unknown> }).inbox.total = '150'
    expect(isSpamImpactResponse(value, 2)).toBe(false)
  })

  it('rejects an inboxIncomplete that is not a boolean', () => {
    expect(isSpamImpactResponse({ ...clone(), inboxIncomplete: 'no' }, 2)).toBe(false)
  })

  it('rejects phrases that is not an array', () => {
    expect(isSpamImpactResponse({ ...clone(), phrases: {} }, 2)).toBe(false)
  })

  it('rejects a count that is not a number', () => {
    const value = withFirstPhrase((phrase) => {
      ;(phrase.inbox as Record<string, unknown>).count = '2'
    })
    expect(isSpamImpactResponse(value, 2)).toBe(false)
  })

  it('rejects emails that is not an array', () => {
    const value = withFirstPhrase((phrase) => {
      ;(phrase.spam as Record<string, unknown>).emails = 'none'
    })
    expect(isSpamImpactResponse(value, 2)).toBe(false)
  })

  it('rejects an email without a string subject', () => {
    const value = withFirstPhrase((phrase) => {
      ;(phrase.inbox as { emails: Record<string, unknown>[] }).emails[0].subject = undefined
    })
    expect(isSpamImpactResponse(value, 2)).toBe(false)
  })

  it('rejects a phrase entry that is null', () => {
    expect(isSpamImpactResponse({ ...clone(), phrases: [null, null] }, 2)).toBe(false)
  })
})
