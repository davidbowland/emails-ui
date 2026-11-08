import React from 'react'

import SpamSuggestions, { SpamSuggestionsProps } from './index'
import * as emails from '@services/emails'
import { account, accountId, emailId, spamImpactIncomplete, spamImpactResponse } from '@test/__mocks__'
import '@testing-library/jest-dom'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Account,
  HttpError,
  SpamImpactResponse,
  SpamPhraseImpact,
  SpamSuggestion,
  SpamSuggestionsResponse,
} from '@types'

jest.mock('@services/emails')

describe('SpamSuggestions component', () => {
  const noImpact = spamImpactResponse.phrases[1]
  const phraseImpact = (phrase: string, impact: Partial<SpamPhraseImpact>): SpamPhraseImpact => ({
    ...noImpact,
    ...impact,
    phrase,
  })
  const inboxHit = spamImpactResponse.phrases[0].inbox
  const spamHit = spamImpactResponse.phrases[0].spam

  // "app development" matches the Inbox (2 emails) and Spam; "lottery" nothing; "crypto" the Inbox (2 emails).
  const impactResponse: SpamImpactResponse = {
    ...spamImpactResponse,
    phrases: [
      phraseImpact('app development', { inbox: inboxHit, spam: spamHit }),
      phraseImpact('lottery', {}),
      phraseImpact('crypto', { inbox: inboxHit }),
    ],
  }

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

  const props: SpamSuggestionsProps = { accountId, emailId, onApplied, onClose, open: true }

  const httpError = (status?: number, code?: string): HttpError => Object.assign(new Error('failed'), { code, status })

  const renderResults = async (overrides: Partial<SpamSuggestionsProps> = {}): Promise<void> => {
    render(<SpamSuggestions {...props} {...overrides} />)
    await screen.findByRole('checkbox', { name: 'Add “app development” to block phrases' })
    await screen.findByText(/We finished checking your mail/)
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
    jest.mocked(emails).postSpamImpact.mockResolvedValue(impactResponse)
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
    it('lists each suggestion as a labeled checkbox with nothing picked', async () => {
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
      jest
        .mocked(emails)
        .postSpamImpact.mockResolvedValueOnce({ ...impactResponse, phrases: [impactResponse.phrases[1]] })
      render(<SpamSuggestions {...props} />)

      expect(await screen.findByText(/1 suggested change\./)).toBeInTheDocument()
    })

    it('shows the intro and the footnote about what was checked', async () => {
      await renderResults()

      expect(screen.getByText('Pick the changes you want. Nothing is saved until you apply them.')).toBeVisible()
      expect(
        screen.getByText(
          "We checked subjects and message text in 100 of 150 Inbox emails and 25 of 40 Spam emails, newest first. We didn't check attachments or older mail. Future mail with these phrases will go to Spam, unless it comes from a trusted sender.",
        ),
      ).toBeVisible()
    })

    it('leaves the footnote out and makes no check when no phrase is suggested', async () => {
      jest.mocked(emails).postSpamSuggestions.mockResolvedValueOnce({ suggestions: [removeSender, raiseHigh] })
      render(<SpamSuggestions {...props} />)

      await screen.findByRole('checkbox', { name: 'Raise sensitivity to High' })

      expect(screen.queryByText(/We checked subjects and message text/)).not.toBeInTheDocument()
      expect(emails.postSpamImpact).not.toHaveBeenCalled()
    })

    it('checks the phrases in suggestion order, excluding the moved email', async () => {
      await renderResults()

      expect(emails.postSpamImpact).toHaveBeenCalledTimes(1)
      expect(emails.postSpamImpact).toHaveBeenCalledWith(accountId, ['app development', 'lottery', 'crypto'], emailId)
    })

    it('shows the checking line on each phrase row until the check resolves', async () => {
      const response = deferred<SpamImpactResponse>()
      jest.mocked(emails).postSpamImpact.mockReturnValueOnce(response.promise)
      render(<SpamSuggestions {...props} />)
      await screen.findByRole('checkbox', { name: 'Add “lottery” to block phrases' })

      expect(screen.getAllByText('Checking your mail…')).toHaveLength(3)
      expect(screen.queryByText(/We checked subjects and message text/)).not.toBeInTheDocument()

      await act(async () => response.resolve(impactResponse))

      expect(screen.queryByText('Checking your mail…')).not.toBeInTheDocument()
      expect(screen.getAllByText(/Matches 2 of 100 Inbox emails:/)).toHaveLength(2)
    })

    it('announces when the check finishes', async () => {
      await renderResults()

      expect(screen.getByRole('status')).toHaveTextContent('5 suggested changes. We finished checking your mail.')
    })

    it('describes a row with its reason and impact', async () => {
      await renderResults()

      expect(screen.getByRole('checkbox', { name: 'Add “lottery” to block phrases' })).toHaveAccessibleDescription(
        'A prize scam. No matches in 100 Inbox emails No matches in 25 Spam emails',
      )
    })

    it("shows each phrase's result in its own position", async () => {
      const response: SpamImpactResponse = {
        ...impactResponse,
        phrases: [phraseImpact('lottery', { inbox: inboxHit }), phraseImpact('app development', {})],
      }
      jest.mocked(emails).postSpamSuggestions.mockResolvedValueOnce({
        suggestions: [removeSender, lottery, raiseHigh, appDevelopment],
      })
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce(response)
      render(<SpamSuggestions {...props} />)
      await screen.findByText(/We finished checking your mail/)

      expect(emails.postSpamImpact).toHaveBeenCalledWith(accountId, ['lottery', 'app development'], emailId)
      expect(screen.getByRole('checkbox', { name: 'Add “lottery” to block phrases' })).toHaveAccessibleDescription(
        /Matches 2 of 100 Inbox emails/,
      )
      expect(
        screen.getByRole('checkbox', { name: 'Add “app development” to block phrases' }),
      ).toHaveAccessibleDescription(/No matches in 100 Inbox emails/)
    })

    it('lists the matching emails the API sent', async () => {
      await renderResults()

      const description = screen.getByRole('checkbox', {
        name: 'Add “app development” to block phrases',
      })
      expect(description).toHaveAccessibleDescription(/Lunch on Friday.*friend@domain\.com/)
      expect(description).toHaveAccessibleDescription(/Your receipt.*billing@shop\.com/)
      expect(screen.getByRole('checkbox', { name: 'Add “lottery” to block phrases' })).not.toHaveAccessibleDescription(
        /Lunch on Friday/,
      )
    })

    it('drops the old check result when the email changes while open', async () => {
      const response = deferred<SpamImpactResponse>()
      const { rerender } = render(<SpamSuggestions {...props} />)
      await screen.findByText(/We finished checking your mail/)
      jest.mocked(emails).postSpamImpact.mockReturnValueOnce(response.promise)

      rerender(<SpamSuggestions {...props} emailId="other" />)
      await screen.findAllByText('Checking your mail…')

      expect(emails.postSpamImpact).toHaveBeenLastCalledWith(
        accountId,
        ['app development', 'lottery', 'crypto'],
        'other',
      )
      expect(screen.queryByText(/Matches 2 of 100 Inbox emails/)).not.toBeInTheDocument()
      expect(screen.queryByText(/We checked subjects and message text/)).not.toBeInTheDocument()
    })

    it('leaves a dropped malformed phrase out of the check', async () => {
      jest.mocked(emails).postSpamSuggestions.mockResolvedValueOnce({
        suggestions: [{ id: 'x', kind: 'addBlockPhrase', reason: 'Odd value.', value: 7 }, lottery, raiseHigh],
      } as unknown as SpamSuggestionsResponse)
      jest
        .mocked(emails)
        .postSpamImpact.mockResolvedValueOnce({ ...impactResponse, phrases: [impactResponse.phrases[1]] })
      render(<SpamSuggestions {...props} />)
      await screen.findByText(/We finished checking your mail/)

      expect(emails.postSpamImpact).toHaveBeenCalledWith(accountId, ['lottery'], emailId)
    })

    it.each([
      ['a rejected check', () => jest.mocked(emails).postSpamImpact.mockRejectedValueOnce(httpError(503))],
      [
        'a malformed response',
        () =>
          jest.mocked(emails).postSpamImpact.mockResolvedValueOnce({ phrases: [] } as unknown as SpamImpactResponse),
      ],
      [
        'a response with the wrong number of phrases',
        () => jest.mocked(emails).postSpamImpact.mockResolvedValueOnce(spamImpactIncomplete),
      ],
    ])('shows the failure line on each phrase row for %s', async (_name, arrange) => {
      arrange()
      render(<SpamSuggestions {...props} />)
      await screen.findByText(/We couldn't check your mail/)

      expect(screen.getAllByText("We couldn't check this phrase against your mail.")).toHaveLength(3)
      expect(screen.queryByText(/We checked subjects and message text/)).not.toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveTextContent("We couldn't check your mail.")
    })

    it('ignores a check result that arrives after closing', async () => {
      const response = deferred<SpamImpactResponse>()
      jest.mocked(emails).postSpamImpact.mockReturnValueOnce(response.promise)
      const { rerender } = render(<SpamSuggestions {...props} />)
      await screen.findByRole('checkbox', { name: 'Add “lottery” to block phrases' })
      rerender(<SpamSuggestions {...props} open={false} />)

      await act(async () => response.resolve(impactResponse))
      jest.mocked(emails).postSpamSuggestions.mockResolvedValueOnce({ suggestions })
      jest.mocked(emails).postSpamImpact.mockReturnValueOnce(new Promise(() => undefined))
      rerender(<SpamSuggestions {...props} />)
      await screen.findByRole('checkbox', { name: 'Add “lottery” to block phrases' })

      expect(screen.queryByText(/Matches 2 of 100 Inbox emails/)).not.toBeInTheDocument()
      expect(screen.getAllByText('Checking your mail…')).toHaveLength(3)
    })

    it('ignores a check failure that arrives after closing', async () => {
      let reject: (reason: unknown) => void = () => undefined
      jest.mocked(emails).postSpamImpact.mockReturnValueOnce(
        new Promise((_, fail) => {
          reject = fail
        }),
      )
      const { rerender } = render(<SpamSuggestions {...props} />)
      await screen.findByRole('checkbox', { name: 'Add “lottery” to block phrases' })
      rerender(<SpamSuggestions {...props} open={false} />)

      await act(async () => reject(httpError(503)))

      expect(console.error).not.toHaveBeenCalledWith('Error checking suggested phrases against mail', expect.anything())
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
        'A phrase you picked matches emails in your Inbox. Those emails stay put, but new mail containing it will go to Spam, unless it comes from a trusted sender.',
      )
      expect(screen.getByRole('button', { name: 'Apply 1 change anyway' })).toBeInTheDocument()
    })

    it('uses the plural warning for two matching phrases', async () => {
      await renderResults()
      await pick('Add “app development” to block phrases')
      await pick('Add “crypto” to block phrases')
      await pick('Add “lottery” to block phrases')

      expect(screen.getByRole('note')).toHaveTextContent(
        'Phrases you picked match emails in your Inbox. Those emails stay put, but new mail containing them will go to Spam, unless it comes from a trusted sender.',
      )
      expect(screen.getByRole('button', { name: 'Apply 3 changes anyway' })).toBeInTheDocument()
    })

    it('says "anyway" while the check is still running, and applies', async () => {
      jest.mocked(emails).postSpamImpact.mockReturnValueOnce(new Promise(() => undefined))
      render(<SpamSuggestions {...props} />)
      await screen.findByRole('checkbox', { name: 'Add “lottery” to block phrases' })
      await pick('Add “lottery” to block phrases')
      await userEvent.click(screen.getByRole('button', { name: 'Apply 1 change anyway' }))

      expect(screen.queryByRole('note')).not.toBeInTheDocument()
      expect(onApplied).toHaveBeenCalledWith(1)
    })

    it('says "anyway" when the check failed', async () => {
      jest.mocked(emails).postSpamImpact.mockRejectedValueOnce(httpError(503))
      render(<SpamSuggestions {...props} />)
      await screen.findByText(/We couldn't check your mail/)
      await pick('Add “lottery” to block phrases')

      expect(screen.getByRole('button', { name: 'Apply 1 change anyway' })).toBeInTheDocument()
      expect(screen.queryByRole('note')).not.toBeInTheDocument()
    })

    it('says "anyway" when the Inbox was only partly checked', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce({
        ...spamImpactIncomplete,
        phrases: [phraseImpact('app development', {}), phraseImpact('lottery', {}), phraseImpact('crypto', {})],
      })
      render(<SpamSuggestions {...props} />)
      await screen.findByText(/We finished checking your mail/)
      await pick('Add “lottery” to block phrases')

      expect(screen.getByRole('button', { name: 'Apply 1 change anyway' })).toBeInTheDocument()
    })

    it('does not say "anyway" for a Spam-only match', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce({
        ...impactResponse,
        phrases: [
          phraseImpact('app development', { spam: spamHit }),
          phraseImpact('lottery', {}),
          impactResponse.phrases[2],
        ],
      })
      render(<SpamSuggestions {...props} />)
      await screen.findByText(/We finished checking your mail/)
      await pick('Add “app development” to block phrases')

      expect(screen.getByRole('button', { name: 'Apply 1 change' })).toBeInTheDocument()
    })

    it('does not say "anyway" for a sender change while the check runs', async () => {
      jest.mocked(emails).postSpamImpact.mockReturnValueOnce(new Promise(() => undefined))
      render(<SpamSuggestions {...props} />)
      await screen.findByRole('checkbox', { name: 'Add “lottery” to block phrases' })
      await pick('Remove @pitch.example from trusted senders')

      expect(screen.getByRole('button', { name: 'Apply 1 change' })).toBeInTheDocument()
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

    it('skips the save and reports 0 when every pick is already a rule', async () => {
      jest.mocked(emails).getAccount.mockResolvedValueOnce({
        ...spamAccount,
        spamFilter: { blockPhrases: ['Lottery'], sensitivity: 'medium', trustedSenders: [] },
      })
      await renderResults()
      await pick('Add “lottery” to block phrases')
      await userEvent.click(screen.getByRole('button', { name: 'Apply 1 change' }))

      expect(emails.putAccount).not.toHaveBeenCalled()
      expect(onApplied).toHaveBeenCalledWith(0)
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
        404,
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
