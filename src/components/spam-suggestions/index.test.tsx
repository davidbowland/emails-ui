import React from 'react'

import SpamSuggestions, { SpamSuggestionsProps } from './index'
import * as emails from '@services/emails'
import { account, accountId, emailId } from '@test/__mocks__'
import '@testing-library/jest-dom'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Account, EmailBatch, HttpError, SpamSuggestion, SpamSuggestionsResponse } from '@types'

jest.mock('@services/emails')

describe('SpamSuggestions component', () => {
  const inboxEmail = (id: string, subject: string): EmailBatch => ({
    accountId,
    data: { from: 'someone@domain.com', subject, timestamp: 1_700_000_000_000, to: [], viewed: true },
    id,
  })

  // "app development" matches five subjects; "crypto" matches one; "lottery" none.
  const inboxEmails: EmailBatch[] = [
    inboxEmail('i1', 'App development kickoff'),
    inboxEmail('i2', 'Re: app development budget'),
    inboxEmail('i3', 'APP-DEVELOPMENT timeline'),
    inboxEmail('i4', 'Notes on app development'),
    inboxEmail('i5', 'App development: next steps'),
    inboxEmail('i6', 'Crypto tax forms'),
    inboxEmail('i7', 'Lunch?'),
  ]

  const appDevelopment: SpamSuggestion = {
    id: 's1',
    kind: 'addBlockPhrase',
    reason: 'A pitch for outsourced app work.',
    value: 'app development',
  }
  const lottery: SpamSuggestion = { id: 's2', kind: 'addBlockPhrase', reason: 'A prize scam.', value: 'lottery' }
  const crypto: SpamSuggestion = { id: 's3', kind: 'addBlockPhrase', reason: 'Crypto offers.', value: 'crypto' }
  const removeSender: SpamSuggestion = {
    id: 's4',
    kind: 'removeTrustedSender',
    reason: 'This sender sent the spam.',
    value: '@pitch.example',
  }
  const raiseHigh: SpamSuggestion = {
    id: 's5',
    kind: 'raiseSensitivity',
    reason: 'More spam is slipping by.',
    value: 'high',
  }
  const suggestions: SpamSuggestion[] = [appDevelopment, lottery, crypto, removeSender, raiseHigh]

  const spamAccount: Account = {
    ...account,
    spamFilter: { blockPhrases: ['casino'], sensitivity: 'medium', trustedSenders: ['@pitch.example', 'me@home.com'] },
  }

  const onApplied = jest.fn()
  const onClose = jest.fn()

  const props: SpamSuggestionsProps = { accountId, emailId, inboxEmails, onApplied, onClose, open: true }

  const httpError = (status?: number, code?: string): HttpError => Object.assign(new Error('failed'), { code, status })

  const renderResults = async (overrides: Partial<SpamSuggestionsProps> = {}): Promise<void> => {
    render(<SpamSuggestions {...props} {...overrides} />)
    await screen.findByRole('checkbox', { name: 'Add “app development” to block phrases' })
  }

  const pick = async (name: string): Promise<void> => {
    await userEvent.click(screen.getByRole('checkbox', { name }))
  }

  const deferred = <T,>(): { promise: Promise<T>; resolve: (value: T) => void } => {
    let resolve: (value: T) => void = () => undefined
    const promise = new Promise<T>((done) => {
      resolve = done
    })
    return { promise, resolve }
  }

  beforeAll(() => {
    jest.mocked(emails).postSpamSuggestions.mockResolvedValue({ suggestions })
    jest.mocked(emails).getAccount.mockResolvedValue(spamAccount)
    jest.mocked(emails).putAccount.mockResolvedValue(spamAccount)
    console.error = jest.fn()
  })

  describe('loading', () => {
    it('shows a status while reading the email', () => {
      jest.mocked(emails).postSpamSuggestions.mockReturnValueOnce(new Promise(() => undefined))
      render(<SpamSuggestions {...props} />)

      expect(screen.getByRole('dialog', { name: 'Suggested rule changes' })).toBeVisible()
      expect(screen.getByRole('status')).toHaveTextContent('Reading this email…')
    })

    it('asks for suggestions for this email', () => {
      jest.mocked(emails).postSpamSuggestions.mockReturnValueOnce(new Promise(() => undefined))
      render(<SpamSuggestions {...props} />)

      expect(emails.postSpamSuggestions).toHaveBeenCalledWith(accountId, emailId)
    })

    it('asks for nothing while closed', () => {
      render(<SpamSuggestions {...props} open={false} />)

      expect(emails.postSpamSuggestions).not.toHaveBeenCalled()
    })

    it('closes with Cancel', async () => {
      jest.mocked(emails).postSpamSuggestions.mockReturnValueOnce(new Promise(() => undefined))
      render(<SpamSuggestions {...props} />)

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(onClose).toHaveBeenCalled()
    })

    it('keeps focus on the first button when the results arrive', async () => {
      const response = deferred<SpamSuggestionsResponse>()
      jest.mocked(emails).postSpamSuggestions.mockReturnValueOnce(response.promise)
      render(<SpamSuggestions {...props} />)
      expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()

      await act(async () => response.resolve({ suggestions }))

      expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
    })

    it('ignores a response that arrives after closing', async () => {
      const response = deferred<SpamSuggestionsResponse>()
      jest.mocked(emails).postSpamSuggestions.mockReturnValueOnce(response.promise)
      const { rerender } = render(<SpamSuggestions {...props} />)
      rerender(<SpamSuggestions {...props} open={false} />)

      await act(async () => response.resolve({ suggestions }))

      expect(screen.queryByRole('checkbox', { hidden: true })).not.toBeInTheDocument()
    })

    it('ignores an error that arrives after closing', async () => {
      let reject: (reason: unknown) => void = () => undefined
      jest.mocked(emails).postSpamSuggestions.mockReturnValueOnce(
        new Promise((_, fail) => {
          reject = fail
        }),
      )
      const { rerender } = render(<SpamSuggestions {...props} />)
      rerender(<SpamSuggestions {...props} open={false} />)

      await act(async () => reject(httpError(429, 'DAILY_LIMIT')))

      expect(screen.queryByText("You've reached today's limit for rule suggestions.")).not.toBeInTheDocument()
    })
  })

  describe('results', () => {
    it('lists each suggestion as a labelled checkbox with nothing picked', async () => {
      await renderResults()

      const names = screen.getAllByRole('checkbox').map((checkbox) => checkbox.getAttribute('aria-labelledby'))
      expect(names).toHaveLength(5)
      expect(screen.getByRole('checkbox', { name: 'Add “lottery” to block phrases' })).not.toBeChecked()
      expect(screen.getByRole('checkbox', { name: 'Remove @pitch.example from trusted senders' })).not.toBeChecked()
      expect(screen.getByRole('checkbox', { name: 'Raise sensitivity to High' })).not.toBeChecked()
    })

    it('announces how many changes are suggested', async () => {
      await renderResults()

      expect(screen.getByRole('status')).toHaveTextContent('5 suggested changes.')
    })

    it('announces a single suggestion', async () => {
      jest.mocked(emails).postSpamSuggestions.mockResolvedValueOnce({ suggestions: [lottery] })
      render(<SpamSuggestions {...props} />)

      expect(await screen.findByText('1 suggested change.')).toBeInTheDocument()
    })

    it('shows the intro and the subjects-only note', async () => {
      await renderResults()

      expect(screen.getByText('Pick the changes you want. Nothing is saved until you apply them.')).toBeVisible()
      expect(
        screen.getByText(
          'We checked your Inbox subjects only. New mail with these phrases in the body will go to Spam too.',
        ),
      ).toBeVisible()
    })

    it('leaves the subjects-only note out when no phrase is suggested', async () => {
      jest.mocked(emails).postSpamSuggestions.mockResolvedValueOnce({ suggestions: [removeSender, raiseHigh] })
      render(<SpamSuggestions {...props} />)

      await screen.findByRole('checkbox', { name: 'Raise sensitivity to High' })

      expect(screen.queryByText(/We checked your Inbox subjects only/)).not.toBeInTheDocument()
    })

    it('describes a row with its reason and impact', async () => {
      await renderResults()

      expect(screen.getByRole('checkbox', { name: 'Add “lottery” to block phrases' })).toHaveAccessibleDescription(
        'A prize scam. No Inbox subjects match',
      )
    })

    it('lists up to three matching subjects and counts the rest', async () => {
      await renderResults()

      const checkbox = screen.getByRole('checkbox', { name: 'Add “app development” to block phrases' })
      expect(checkbox).toHaveAccessibleDescription(
        'A pitch for outsourced app work. Matches 5 Inbox subjects: App development kickoff Re: app development budget APP-DEVELOPMENT timeline and 2 more',
      )
    })

    it('keeps the matching subjects out of any nested list', async () => {
      await renderResults()

      expect(screen.getAllByRole('list')).toHaveLength(1)
      expect(screen.getAllByRole('listitem')).toHaveLength(5)
    })

    it('uses the singular for one matching subject', async () => {
      await renderResults()

      expect(screen.getByText(/Matches 1 Inbox subject:/)).toBeVisible()
      expect(screen.getByText('Crypto tax forms')).toBeVisible()
    })

    it('says a sender change applies to new mail only', async () => {
      await renderResults()

      expect(
        screen.getByRole('checkbox', { name: 'Remove @pitch.example from trusted senders' }),
      ).toHaveAccessibleDescription('This sender sent the spam. Applies to new mail only')
    })

    it('warns that High may catch real mail', async () => {
      await renderResults()

      expect(screen.getByRole('checkbox', { name: 'Raise sensitivity to High' })).toHaveAccessibleDescription(
        'More spam is slipping by. Applies to new mail only. High may catch real mail.',
      )
      expect(
        within(
          screen.getByText('Applies to new mail only. High may catch real mail.').parentElement as HTMLElement,
        ).getByTestId('icon-TriangleAlert'),
      ).toBeInTheDocument()
    })

    it('gives no extra warning for Medium', async () => {
      jest.mocked(emails).postSpamSuggestions.mockResolvedValueOnce({
        suggestions: [{ id: 'm', kind: 'raiseSensitivity', reason: 'Some spam gets through.', value: 'medium' }],
      })
      render(<SpamSuggestions {...props} />)

      expect(await screen.findByRole('checkbox', { name: 'Raise sensitivity to Medium' })).toHaveAccessibleDescription(
        'Some spam gets through. Applies to new mail only',
      )
    })

    it('treats a missing subject as no match', async () => {
      const noSubject: EmailBatch = { ...inboxEmail('i9', ''), data: { ...inboxEmail('i9', '').data, subject: '' } }
      jest.mocked(emails).postSpamSuggestions.mockResolvedValueOnce({ suggestions: [lottery] })
      render(<SpamSuggestions {...props} inboxEmails={[noSubject]} />)

      expect(await screen.findByText('No Inbox subjects match')).toBeVisible()
    })
  })

  describe('apply button', () => {
    it('reads "Apply changes" and does nothing with no picks', async () => {
      await renderResults()

      const apply = screen.getByRole('button', { name: 'Apply changes' })
      expect(apply).toHaveAccessibleDescription('Pick the changes you want. Nothing is saved until you apply them.')
      await userEvent.click(apply)

      expect(emails.getAccount).not.toHaveBeenCalled()
      expect(emails.putAccount).not.toHaveBeenCalled()
    })

    it('counts one pick', async () => {
      await renderResults()
      await pick('Add “lottery” to block phrases')

      expect(screen.getByRole('button', { name: 'Apply 1 change' })).toBeInTheDocument()
      expect(screen.queryByRole('note')).not.toBeInTheDocument()
    })

    it('counts several picks', async () => {
      await renderResults()
      await pick('Add “lottery” to block phrases')
      await pick('Raise sensitivity to High')

      expect(screen.getByRole('button', { name: 'Apply 2 changes' })).toBeInTheDocument()
    })

    it('drops a pick when unticked', async () => {
      await renderResults()
      await pick('Add “lottery” to block phrases')
      await pick('Add “lottery” to block phrases')

      expect(screen.getByRole('button', { name: 'Apply changes' })).toBeInTheDocument()
    })

    it('warns once a matching phrase is picked', async () => {
      await renderResults()
      await pick('Add “app development” to block phrases')

      expect(screen.getByRole('note')).toHaveTextContent(
        'A phrase you picked matches emails in your Inbox. Those emails stay put, but new mail containing it will go to Spam.',
      )
      expect(screen.getByRole('button', { name: 'Apply 1 change anyway' })).toBeInTheDocument()
    })

    it('uses the plural warning for two matching phrases', async () => {
      await renderResults()
      await pick('Add “app development” to block phrases')
      await pick('Add “crypto” to block phrases')
      await pick('Add “lottery” to block phrases')

      expect(screen.getByRole('note')).toHaveTextContent(
        'Phrases you picked match emails in your Inbox. Those emails stay put, but new mail containing them will go to Spam.',
      )
      expect(screen.getByRole('button', { name: 'Apply 3 changes anyway' })).toBeInTheDocument()
    })
  })

  describe('applying', () => {
    it('re-reads the account, saves only the picks and reports the count', async () => {
      await renderResults()
      await pick('Add “app development” to block phrases')
      await pick('Remove @pitch.example from trusted senders')
      await userEvent.click(screen.getByRole('button', { name: 'Apply 2 changes anyway' }))

      expect(emails.getAccount).toHaveBeenCalledWith(accountId)
      expect(emails.putAccount).toHaveBeenCalledWith(accountId, {
        ...spamAccount,
        spamFilter: {
          blockPhrases: ['casino', 'app development'],
          sensitivity: 'medium',
          trustedSenders: ['me@home.com'],
        },
      })
      expect(onApplied).toHaveBeenCalledWith(2)
    })

    it('counts only the picks that change the filter', async () => {
      jest.mocked(emails).getAccount.mockResolvedValueOnce({
        ...spamAccount,
        spamFilter: { blockPhrases: ['Lottery'], sensitivity: 'medium', trustedSenders: [] },
      })
      await renderResults()
      await pick('Add “lottery” to block phrases')
      await pick('Remove @pitch.example from trusted senders')
      await pick('Raise sensitivity to High')
      await userEvent.click(screen.getByRole('button', { name: 'Apply 3 changes' }))

      expect(emails.putAccount).toHaveBeenCalledWith(accountId, {
        ...spamAccount,
        spamFilter: { blockPhrases: ['Lottery'], sensitivity: 'high', trustedSenders: [] },
      })
      expect(onApplied).toHaveBeenCalledWith(1)
    })

    it('starts from the default filter for an account without one', async () => {
      jest.mocked(emails).getAccount.mockResolvedValueOnce(account)
      await renderResults()
      await pick('Raise sensitivity to High')
      await userEvent.click(screen.getByRole('button', { name: 'Apply 1 change' }))

      expect(emails.putAccount).toHaveBeenCalledWith(accountId, {
        ...account,
        spamFilter: { blockPhrases: [], sensitivity: 'high', trustedSenders: [] },
      })
    })

    it('shows "Applying…" and ignores Escape, Cancel and picks while saving', async () => {
      jest.mocked(emails).putAccount.mockReturnValueOnce(new Promise(() => undefined))
      await renderResults()
      await pick('Add “lottery” to block phrases')
      await userEvent.click(screen.getByRole('button', { name: 'Apply 1 change' }))

      const applying = await screen.findByRole('button', { name: 'Applying…' })
      await userEvent.click(applying)
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
      await userEvent.keyboard('{Escape}')
      await pick('Raise sensitivity to High')

      expect(onClose).not.toHaveBeenCalled()
      expect(emails.getAccount).toHaveBeenCalledTimes(1)
      expect(screen.getByRole('checkbox', { name: 'Raise sensitivity to High' })).not.toBeChecked()
    })

    it('stops before the API when block phrases would pass the limit', async () => {
      const full = Array.from({ length: 100 }, (_, index) => `phrase ${index}`)
      jest.mocked(emails).getAccount.mockResolvedValueOnce({
        ...spamAccount,
        spamFilter: { blockPhrases: full, sensitivity: 'medium', trustedSenders: [] },
      })
      await renderResults()
      await pick('Add “lottery” to block phrases')
      await userEvent.click(screen.getByRole('button', { name: 'Apply 1 change' }))

      expect(within(screen.getByRole('dialog')).getByRole('alert')).toHaveTextContent(
        'These would put your block phrases over the limit of 100. Pick fewer, or make room under Spam filter in Settings and add them there.',
      )
      expect(emails.putAccount).not.toHaveBeenCalled()
      expect(onApplied).not.toHaveBeenCalled()
      expect(screen.getByRole('checkbox', { name: 'Add “lottery” to block phrases' })).toBeChecked()
    })

    it('saves when trusted senders are already over the limit but the picks do not grow them', async () => {
      const overFull = Array.from({ length: 101 }, (_, index) => `user${index}@domain.com`)
      jest.mocked(emails).getAccount.mockResolvedValueOnce({
        ...spamAccount,
        spamFilter: { blockPhrases: [], sensitivity: 'medium', trustedSenders: overFull },
      })
      await renderResults()
      await pick('Raise sensitivity to High')
      await userEvent.click(screen.getByRole('button', { name: 'Apply 1 change' }))

      expect(emails.putAccount).toHaveBeenCalledWith(accountId, {
        ...spamAccount,
        spamFilter: { blockPhrases: [], sensitivity: 'high', trustedSenders: overFull },
      })
      expect(screen.getByRole('alert')).toBeEmptyDOMElement()
      expect(onApplied).toHaveBeenCalledWith(1)
    })

    it('keeps the picks and explains when saving fails', async () => {
      jest.mocked(emails).putAccount.mockRejectedValueOnce(httpError(500))
      await renderResults()
      await pick('Add “lottery” to block phrases')
      await userEvent.click(screen.getByRole('button', { name: 'Apply 1 change' }))

      expect(
        await within(screen.getByRole('dialog')).findByText(
          "We couldn't save those changes. Your picks are still here — try again.",
        ),
      ).toBeVisible()
      expect(screen.getByRole('alert')).toHaveTextContent(
        "We couldn't save those changes. Your picks are still here — try again.",
      )
      expect(screen.getByRole('checkbox', { name: 'Add “lottery” to block phrases' })).toBeChecked()
      expect(screen.getByRole('button', { name: 'Apply 1 change' })).toBeInTheDocument()
      expect(onApplied).not.toHaveBeenCalled()
    })

    it('explains when re-reading the account fails', async () => {
      jest.mocked(emails).getAccount.mockRejectedValueOnce(httpError(503))
      await renderResults()
      await pick('Add “lottery” to block phrases')
      await userEvent.click(screen.getByRole('button', { name: 'Apply 1 change' }))

      expect(within(screen.getByRole('dialog')).getByRole('alert')).toHaveTextContent(
        "We couldn't save those changes. Your picks are still here — try again.",
      )
      expect(emails.putAccount).not.toHaveBeenCalled()
    })

    it('keeps an empty alert region mounted before any error', async () => {
      await renderResults()

      expect(within(screen.getByRole('dialog')).getByRole('alert')).toBeEmptyDOMElement()
    })

    it('clears the error when applying again', async () => {
      jest.mocked(emails).putAccount.mockRejectedValueOnce(httpError(500))
      await renderResults()
      await pick('Add “lottery” to block phrases')
      await userEvent.click(screen.getByRole('button', { name: 'Apply 1 change' }))
      await screen.findByText("We couldn't save those changes. Your picks are still here — try again.")

      await userEvent.click(screen.getByRole('button', { name: 'Apply 1 change' }))

      expect(screen.getByRole('alert')).toBeEmptyDOMElement()
      expect(onApplied).toHaveBeenCalledWith(1)
    })
  })

  describe('closing', () => {
    it('closes with Cancel and saves nothing', async () => {
      await renderResults()
      await pick('Add “lottery” to block phrases')
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(onClose).toHaveBeenCalled()
      expect(emails.putAccount).not.toHaveBeenCalled()
    })

    it('closes with Escape', async () => {
      await renderResults()
      await userEvent.keyboard('{Escape}')

      expect(onClose).toHaveBeenCalled()
    })

    it('returns focus to the trigger', async () => {
      const { rerender } = render(
        <>
          <button>Suggest rule changes</button>
          <SpamSuggestions {...props} open={false} />
        </>,
      )
      screen.getByRole('button', { name: 'Suggest rule changes' }).focus()
      rerender(
        <>
          <button>Suggest rule changes</button>
          <SpamSuggestions {...props} />
        </>,
      )
      await screen.findByRole('checkbox', { name: 'Add “lottery” to block phrases' })

      rerender(
        <>
          <button>Suggest rule changes</button>
          <SpamSuggestions {...props} open={false} />
        </>,
      )

      expect(screen.getByRole('button', { name: 'Suggest rule changes' })).toHaveFocus()
    })

    it('starts fresh when opened again', async () => {
      const { rerender } = render(<SpamSuggestions {...props} />)
      await screen.findByRole('checkbox', { name: 'Add “lottery” to block phrases' })
      await pick('Add “lottery” to block phrases')
      rerender(<SpamSuggestions {...props} open={false} />)
      jest.mocked(emails).postSpamSuggestions.mockReturnValueOnce(new Promise(() => undefined))

      rerender(<SpamSuggestions {...props} />)

      expect(screen.getByRole('status')).toHaveTextContent('Reading this email…')
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    })
  })

  describe('messages', () => {
    it.each([
      [
        429,
        'DAILY_LIMIT',
        "You've reached today's limit for rule suggestions.",
        'Try again tomorrow. This email is still in Spam, and you can change your spam filter anytime in Settings.',
      ],
      [
        429,
        undefined,
        "Rule suggestions aren't available right now.",
        'Try again later. This email is still in Spam, and you can change your spam filter anytime in Settings.',
      ],
      [
        429,
        'THROTTLED',
        "Rule suggestions aren't available right now.",
        'Try again later. This email is still in Spam, and you can change your spam filter anytime in Settings.',
      ],
      [
        503,
        undefined,
        "Rule suggestions aren't available right now.",
        'Try again later. This email is still in Spam, and you can change your spam filter anytime in Settings.',
      ],
      [
        403,
        undefined,
        "Rule suggestions aren't available for this email.",
        "It's still in Spam, and you can change your spam filter anytime in Settings.",
      ],
      [
        500,
        undefined,
        "Rule suggestions aren't available right now.",
        'Try again later. This email is still in Spam, and you can change your spam filter anytime in Settings.',
      ],
      [
        undefined,
        undefined,
        "Rule suggestions aren't available right now.",
        'Try again later. This email is still in Spam, and you can change your spam filter anytime in Settings.',
      ],
    ])('shows the message for status %s with code %s', async (status, code, lead, detail) => {
      jest.mocked(emails).postSpamSuggestions.mockRejectedValueOnce(httpError(status, code))
      render(<SpamSuggestions {...props} />)

      expect(await screen.findByText(lead)).toBeVisible()
      expect(screen.getByRole('status')).toHaveTextContent(`${lead}${detail}`)
      expect(screen.queryByRole('button', { name: /Apply/ })).not.toBeInTheDocument()
    })

    it('shows the message for a rejection that is not an error', async () => {
      jest.mocked(emails).postSpamSuggestions.mockRejectedValueOnce(undefined)
      render(<SpamSuggestions {...props} />)

      expect(await screen.findByText("Rule suggestions aren't available right now.")).toBeVisible()
    })

    it('closes from a message', async () => {
      jest.mocked(emails).postSpamSuggestions.mockRejectedValueOnce(httpError(429, 'DAILY_LIMIT'))
      render(<SpamSuggestions {...props} />)

      await userEvent.click(await screen.findByRole('button', { name: 'Close' }))

      expect(onClose).toHaveBeenCalled()
    })

    it('says when there are no suggestions', async () => {
      jest.mocked(emails).postSpamSuggestions.mockResolvedValueOnce({ suggestions: [] })
      render(<SpamSuggestions {...props} />)

      expect(await screen.findByText("We don't have any suggestions for this email.")).toBeVisible()
      expect(
        screen.getByText(
          "It's still in Spam. To catch more mail like it, add a block phrase under Spam filter in Settings.",
        ),
      ).toBeVisible()
    })

    it('drops suggestions of an unknown kind', async () => {
      jest.mocked(emails).postSpamSuggestions.mockResolvedValueOnce({
        suggestions: [{ id: 'x', kind: 'addTrustedSender', reason: 'Lenient.', value: '@evil.example' }],
      } as unknown as SpamSuggestionsResponse)
      render(<SpamSuggestions {...props} />)

      expect(await screen.findByText("We don't have any suggestions for this email.")).toBeVisible()
    })

    it.each([
      [{ id: 7, kind: 'addBlockPhrase', reason: 'Odd id.', value: 'lottery' }],
      [{ id: 'x', kind: 'addBlockPhrase', reason: 'Odd value.', value: ['lottery'] }],
      [{ id: 'x', kind: 'addBlockPhrase', reason: undefined, value: 'lottery' }],
      [{ id: 'x', kind: 7, reason: 'Odd kind.', value: 'lottery' }],
      [null],
    ])('drops a malformed suggestion %j', async (suggestion) => {
      jest.mocked(emails).postSpamSuggestions.mockResolvedValueOnce({
        suggestions: [suggestion],
      } as unknown as SpamSuggestionsResponse)
      render(<SpamSuggestions {...props} />)

      expect(await screen.findByText("We don't have any suggestions for this email.")).toBeVisible()
    })

    it('keeps only the first suggestion with a given id', async () => {
      jest.mocked(emails).postSpamSuggestions.mockResolvedValueOnce({
        suggestions: [lottery, { ...crypto, id: lottery.id }],
      })
      render(<SpamSuggestions {...props} />)

      await screen.findByRole('checkbox', { name: 'Add “lottery” to block phrases' })

      expect(screen.getAllByRole('checkbox')).toHaveLength(1)
    })

    it('treats a malformed response as no suggestions', async () => {
      jest
        .mocked(emails)
        .postSpamSuggestions.mockResolvedValueOnce({ suggestions: 'nope' } as unknown as SpamSuggestionsResponse)
      render(<SpamSuggestions {...props} />)

      expect(await screen.findByText("We don't have any suggestions for this email.")).toBeVisible()
    })
  })
})
